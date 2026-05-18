import { getUsdcAddress, isUsdcSupportedChain } from '@/lib/usdc'
import { getUsdtAddress, isUsdtSupportedChain } from '@/lib/usdt'
import { NextRequest, NextResponse } from 'next/server'
import {
  createPublicClient,
  createWalletClient,
  decodeFunctionData,
  http,
  isAddress,
  parseAbi,
  type Address
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { mainnet, polygon, polygonAmoy, sepolia } from 'viem/chains'
import { z } from 'zod'
import { asBoolean, asRecord, asString, getAdminSettingRecord, getConfiguredAddress } from './admin-settings'

export const runtime = 'nodejs'

const requestSchema = z.object({
  paymentHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  chainId: z.number().int(),
  token: z.enum(['ethereum', 'usdc', 'usdt']),
  paymentUsdCents: z.number().int().positive().optional(),
  relayUsdCents: z.number().int().positive().optional()
})

const CRYPTO_WALLET_DESTINATION_IDENTIFIER = 'crypto_wallet_destination'
const CRYPTO_PRIVATE_CREDENTIALS_IDENTIFIER = 'crypto_private_credentials'

const SUPPORTED_CHAINS = {
  [mainnet.id]: mainnet,
  [sepolia.id]: sepolia,
  [polygon.id]: polygon,
  [polygonAmoy.id]: polygonAmoy
}

const TRANSFER_ABI = parseAbi(['function transfer(address to, uint256 amount) returns (bool)'])

const relayedHashes = new Map<string, `0x${string}`>()

const normalizeAddress = (address: string): string => address.toLowerCase()

const computeRelayAmount = ({
  receivedAmount,
  paymentUsdCents,
  relayUsdCents
}: {
  receivedAmount: bigint
  paymentUsdCents?: number
  relayUsdCents?: number
}) => {
  if (paymentUsdCents === undefined || relayUsdCents === undefined || relayUsdCents === paymentUsdCents) {
    return receivedAmount
  }

  if (relayUsdCents > paymentUsdCents) {
    throw new Error('Relay target exceeds the original payment amount')
  }

  return (receivedAmount * BigInt(relayUsdCents)) / BigInt(paymentUsdCents)
}

const getRequiredAddress = (value: string | undefined, name: string): Address => {
  if (!value || !isAddress(value)) {
    throw new Error(`${name} is missing or invalid`)
  }
  return value as Address
}

type CryptoWalletDestinations = {
  ethereum?: string
  polygon?: string
  sepolia?: string
  amoy?: string
  bitcoin?: string
}

const parseCryptoWalletDestinations = (value: unknown): CryptoWalletDestinations => {
  if (!value || typeof value !== 'object' || 'error' in value) {
    return {}
  }

  const wallets = value as Record<string, unknown>
  return {
    ethereum: getConfiguredAddress(wallets.ethereum),
    polygon: getConfiguredAddress(wallets.polygon),
    sepolia: getConfiguredAddress(wallets.sepolia),
    amoy: getConfiguredAddress(wallets.amoy),
    bitcoin: getConfiguredAddress(wallets.bitcoin)
  }
}

const resolveDestinationKey = (chainId: number): keyof CryptoWalletDestinations => {
  if (chainId === polygonAmoy.id) return 'amoy'
  if (chainId === polygon.id) return 'polygon'
  if (chainId === sepolia.id) return 'sepolia'
  return 'ethereum'
}

const getAdminRelayDestination = async (chainId: number): Promise<Address> => {
  const setting = await getAdminSettingRecord(CRYPTO_WALLET_DESTINATION_IDENTIFIER)
  const wallets = parseCryptoWalletDestinations(setting)
  const key = resolveDestinationKey(chainId)
  const destination =
    wallets[key] ??
    (key === 'amoy' ? wallets.polygon : undefined) ??
    (key === 'sepolia' ? wallets.ethereum : undefined) ??
    (key === 'polygon' ? wallets.ethereum : undefined) ??
    undefined

  return getRequiredAddress(destination, `${CRYPTO_WALLET_DESTINATION_IDENTIFIER}.${key}`)
}

const getCryptoCredentials = async (
  chainId: number
): Promise<{ enabled: boolean; evmNative?: Address; evmPrivate?: string }> => {
  const value = await getAdminSettingRecord(CRYPTO_PRIVATE_CREDENTIALS_IDENTIFIER)

  const networkKey =
    chainId === polygonAmoy.id
      ? 'amoy'
      : chainId === polygon.id
        ? 'polygon'
        : chainId === sepolia.id
          ? 'sepolia'
          : 'ethereum'

  const networkValue = asRecord(value[networkKey])
  const rootEnabled = asBoolean(value.enabled)
  const networkEnabled = asBoolean(networkValue?.enabled)
  const enabled = networkEnabled ?? rootEnabled ?? true

  const evmNativeValue =
    asString(networkValue?.evmNative) ??
    asString(networkValue?.native) ??
    asString(networkValue?.address) ??
    asString(value.evmNative) ??
    asString(value.native) ??
    asString(value.address)

  const evmPrivateValue =
    asString(networkValue?.evmPrivate) ??
    asString(networkValue?.privateKey) ??
    asString(networkValue?.private) ??
    asString(value.evmPrivate) ??
    asString(value.privateKey) ??
    asString(value.private)

  return {
    enabled,
    evmNative: evmNativeValue
      ? getRequiredAddress(evmNativeValue, `${CRYPTO_PRIVATE_CREDENTIALS_IDENTIFIER}.${networkKey}.evmNative`)
      : undefined,
    evmPrivate: evmPrivateValue
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid relay request payload' }, { status: 400 })
    }

    const { paymentHash, chainId, token, paymentUsdCents, relayUsdCents } = parsed.data

    const existingRelayHash = relayedHashes.get(paymentHash)
    if (existingRelayHash) {
      return NextResponse.json({
        success: true,
        relayHash: existingRelayHash,
        alreadyRelayed: true
      })
    }

    const chain = SUPPORTED_CHAINS[chainId as keyof typeof SUPPORTED_CHAINS]
    if (!chain) {
      return NextResponse.json({ error: 'Unsupported chain' }, { status: 400 })
    }

    const cryptoCredentials = await getCryptoCredentials(chainId).catch(() => null)

    if (cryptoCredentials && !cryptoCredentials.enabled) {
      return NextResponse.json({ error: 'Relay is disabled for this network' }, { status: 503 })
    }

    const relayPrivateKey = cryptoCredentials?.evmPrivate
    if (!relayPrivateKey) {
      return NextResponse.json({ error: 'EP is not configured' }, { status: 500 })
    }

    const privateKey = relayPrivateKey.startsWith('0x') ? relayPrivateKey : (`0x${relayPrivateKey}` as const)
    const account = privateKeyToAccount(privateKey as `0x${string}`)

    const configuredRelaySource = cryptoCredentials?.evmNative ?? account.address
    if (normalizeAddress(configuredRelaySource) !== normalizeAddress(account.address)) {
      return NextResponse.json(
        {
          error: 'RELAY_SOURCE_ADDRESS must match RELAY_PRIVATE_KEY account address'
        },
        { status: 500 }
      )
    }

    const relayDestination = await getAdminRelayDestination(chainId)

    const publicClient = createPublicClient({
      chain,
      transport: http()
    })
    const walletClient = createWalletClient({
      account: account,
      chain,
      transport: http()
    })

    const [transaction, receipt] = await Promise.all([
      publicClient.getTransaction({ hash: paymentHash as `0x${string}` }),
      publicClient.getTransactionReceipt({ hash: paymentHash as `0x${string}` })
    ])

    if (receipt.status !== 'success') {
      return NextResponse.json({ error: 'Payment transaction is not successful' }, { status: 400 })
    }

    let receivedAmount = BigInt(0)
    if (token === 'ethereum') {
      if (!transaction.to || normalizeAddress(transaction.to) !== normalizeAddress(configuredRelaySource)) {
        return NextResponse.json(
          {
            error: 'Payment was not sent to relay source address',
            expectedRelaySource: configuredRelaySource,
            actualRecipient: transaction.to ?? null
          },
          { status: 400 }
        )
      }

      receivedAmount = transaction.value
    } else {
      const tokenAddress =
        token === 'usdc'
          ? isUsdcSupportedChain(chainId)
            ? getUsdcAddress(chainId)
            : undefined
          : isUsdtSupportedChain(chainId)
            ? getUsdtAddress(chainId)
            : undefined

      if (!tokenAddress) {
        return NextResponse.json(
          {
            error: `Token ${token.toUpperCase()} is not supported on this chain`
          },
          { status: 400 }
        )
      }

      if (!transaction.to || normalizeAddress(transaction.to) !== normalizeAddress(tokenAddress)) {
        return NextResponse.json({ error: 'Payment transaction target does not match token contract' }, { status: 400 })
      }

      let decoded: ReturnType<typeof decodeFunctionData>
      try {
        decoded = decodeFunctionData({
          abi: TRANSFER_ABI,
          data: transaction.input
        })
      } catch {
        return NextResponse.json({ error: 'Unable to decode token transfer input data' }, { status: 400 })
      }
      const [transferTo, transferAmount] = decoded.args as [Address, bigint]

      if (normalizeAddress(transferTo) !== normalizeAddress(configuredRelaySource)) {
        return NextResponse.json(
          {
            error: 'Token transfer recipient is not relay source address',
            expectedRelaySource: configuredRelaySource,
            actualRecipient: transferTo
          },
          { status: 400 }
        )
      }

      receivedAmount = transferAmount
    }

    if (receivedAmount <= BigInt(0)) {
      return NextResponse.json({ error: 'Received amount is zero; relay aborted' }, { status: 400 })
    }

    const relayAmount = computeRelayAmount({
      receivedAmount,
      paymentUsdCents,
      relayUsdCents
    })
    if (relayAmount <= BigInt(0)) {
      return NextResponse.json({ error: 'Relay amount is zero; relay aborted' }, { status: 400 })
    }

    let relayHash: `0x${string}`
    if (token === 'ethereum') {
      relayHash = await walletClient.sendTransaction({
        account: account,
        to: relayDestination,
        value: relayAmount,
        chain
      })
    } else {
      const tokenAddress = token === 'usdc' ? getUsdcAddress(chainId) : getUsdtAddress(chainId)
      if (!tokenAddress) {
        return NextResponse.json({ error: 'Unable to resolve token address for relay' }, { status: 400 })
      }

      relayHash = await walletClient.writeContract({
        account: account,
        chain,
        address: tokenAddress,
        abi: TRANSFER_ABI,
        functionName: 'transfer',
        args: [relayDestination, relayAmount]
      })
    }

    relayedHashes.set(paymentHash, relayHash)

    return NextResponse.json({
      success: true,
      paymentHash,
      relayHash,
      receivedAmount: receivedAmount.toString(),
      relayAmount: relayAmount.toString(),
      relayFeeBps: 0,
      paymentUsdCents: paymentUsdCents ?? null,
      relayUsdCents: relayUsdCents ?? null
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Relay target exceeds the original payment amount') {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.error('Relay forwarding error:', error)
    return NextResponse.json(
      {
        error: 'Relay forwarding failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
