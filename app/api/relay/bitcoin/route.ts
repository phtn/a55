import * as bitcoin from 'bitcoinjs-lib'
import ECPairFactory from 'ecpair'
import { NextRequest, NextResponse } from 'next/server'
import * as ecc from 'tiny-secp256k1'
import { z } from 'zod'
import { asBoolean, asRecord, asString, getAdminSettingRecord, getConfiguredAddress } from '../admin-settings'

export const runtime = 'nodejs'

bitcoin.initEccLib(ecc)
const ECPair = ECPairFactory(ecc)

const requestSchema = z.object({
  paymentHash: z.string().regex(/^(0x)?[a-fA-F0-9]{64}$/),
  paymentUsdCents: z.number().int().positive().optional(),
  relayUsdCents: z.number().int().positive().optional()
})

const DUST_THRESHOLD_SATS = BigInt(546)
const DEFAULT_FEE_RATE_SAT_PER_VB = 10
const MAX_PAYMENT_LOOKUP_ATTEMPTS = 5
const PAYMENT_LOOKUP_RETRY_DELAY_MS = 1_000
const DEFAULT_MEMPOOL_API_BASE_URL = process.env.BITCOIN_RELAY_API_BASE_URL ?? 'https://mempool.space/api'
const CRYPTO_WALLET_DESTINATION_IDENTIFIER = 'crypto_wallet_destination'
const CRYPTO_PRIVATE_CREDENTIALS_IDENTIFIER = 'crypto_private_credentials'

const BITCOIN_ADDRESS_PATTERN = /^(bc1[ac-hj-np-z02-9]{11,71}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/i

const relayedHashes = new Map<string, `0x${string}`>()

const computeRelayAmountSats = ({
  receivedAmountSats,
  paymentUsdCents,
  relayUsdCents
}: {
  receivedAmountSats: bigint
  paymentUsdCents?: number
  relayUsdCents?: number
}) => {
  if (paymentUsdCents === undefined || relayUsdCents === undefined || relayUsdCents === paymentUsdCents) {
    return receivedAmountSats
  }

  if (relayUsdCents > paymentUsdCents) {
    throw new Error('Relay target exceeds the original payment amount')
  }

  return (receivedAmountSats * BigInt(relayUsdCents)) / BigInt(paymentUsdCents)
}

interface MempoolTxOutput {
  scriptpubkey_address?: string
  value?: number
}

interface MempoolTx {
  txid: string
  vout: MempoolTxOutput[]
}

interface MempoolUtxo {
  txid: string
  vout: number
  value: number
}

interface MempoolFeesResponse {
  fastestFee?: number
  halfHourFee?: number
  hourFee?: number
}

interface RelayWalletConfig {
  keyPair: ReturnType<typeof ECPair.fromWIF>
  signer: bitcoin.Signer
  apiBaseUrl: string
  sourceAddress: string
  sourceScript: Buffer
  destinationAddress: string
}

interface RelaySelection {
  utxos: MempoolUtxo[]
  totalInputSats: bigint
  relayAmountSats: bigint
  changeSats: bigint
}

const normalizeTxId = (value: string): string => value.replace(/^0x/i, '').toLowerCase()

const normalizeAddressForCompare = (address: string): string =>
  address.startsWith('bc1') ? address.toLowerCase() : address

const isValidBitcoinAddress = (value: string): boolean => BITCOIN_ADDRESS_PATTERN.test(value)

const toSatsNumber = (value: bigint | number, fieldName: string): number => {
  const numericValue = typeof value === 'bigint' ? Number(value) : value
  if (!Number.isSafeInteger(numericValue) || numericValue < 0) {
    throw new Error(`${fieldName} is outside the supported satoshi range`)
  }

  return numericValue
}

const getRequiredConfig = (value: string | undefined, name: string): string => {
  if (!value) throw new Error(`${name} is missing`)
  return value
}

const normalizeApiBaseUrl = (value: string): string => value.replace(/\/+$/, '')

const createPsbtSigner = (keyPair: ReturnType<typeof ECPair.fromWIF>): bitcoin.Signer => ({
  publicKey: Buffer.from(keyPair.publicKey),
  network: keyPair.network,
  sign: (hash, lowR) => Buffer.from(keyPair.sign(hash, lowR)),
  getPublicKey: () => Buffer.from(keyPair.publicKey),
  ...(typeof keyPair.signSchnorr === 'function'
    ? {
        signSchnorr: (hash: Buffer) => Buffer.from(keyPair.signSchnorr(hash))
      }
    : {})
})

const getBitcoinDestinationAddress = async (): Promise<string> => {
  const setting = await getAdminSettingRecord(CRYPTO_WALLET_DESTINATION_IDENTIFIER)
  const destinationAddress = getRequiredConfig(
    getConfiguredAddress(setting.bitcoin),
    `${CRYPTO_WALLET_DESTINATION_IDENTIFIER}.bitcoin`
  )
  if (!isValidBitcoinAddress(destinationAddress)) {
    throw new Error(`${CRYPTO_WALLET_DESTINATION_IDENTIFIER}.bitcoin is invalid`)
  }

  return destinationAddress
}

const getBitcoinRelayCredentials = async (): Promise<{
  enabled: boolean
  btcApiUrl?: string
  btcNative?: string
  btcPrivate?: string
}> => {
  const value = await getAdminSettingRecord(CRYPTO_PRIVATE_CREDENTIALS_IDENTIFIER)

  const bitcoinValue = asRecord(value.bitcoin)
  const rootEnabled = asBoolean(value.enabled)
  const bitcoinEnabled = asBoolean(bitcoinValue?.enabled)

  return {
    enabled: bitcoinEnabled ?? rootEnabled ?? true,
    btcApiUrl:
      asString(bitcoinValue?.btcApiUrl) ??
      asString(bitcoinValue?.apiUrl) ??
      asString(bitcoinValue?.mempoolApiUrl) ??
      asString(value.btcApiUrl) ??
      asString(value.apiUrl) ??
      asString(value.mempoolApiUrl),
    btcNative:
      asString(bitcoinValue?.btcNative) ??
      asString(bitcoinValue?.native) ??
      asString(bitcoinValue?.address) ??
      asString(value.btcNative) ??
      asString(value.native) ??
      asString(value.address),
    btcPrivate:
      asString(bitcoinValue?.btcPrivate) ??
      asString(bitcoinValue?.privateKey) ??
      asString(bitcoinValue?.private) ??
      asString(value.btcPrivate) ??
      asString(value.privateKey) ??
      asString(value.private)
  }
}

const fetchJson = async <T>(apiBaseUrl: string, path: string): Promise<T> => {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    cache: 'no-store'
  })

  if (!response.ok) {
    throw new Error(`Mempool request failed for ${path} with status ${response.status}`)
  }

  return (await response.json()) as T
}

const fetchText = async (apiBaseUrl: string, path: string, init?: RequestInit): Promise<string> => {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    cache: 'no-store',
    ...init
  })

  const text = await response.text()
  if (!response.ok) {
    throw new Error(`Mempool request failed for ${path} with status ${response.status}: ${text}`)
  }

  return text
}

const sleep = async (ms: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

const getRelayWalletConfig = async ({
  btcApiUrl,
  btcNative,
  btcPrivate
}: {
  btcApiUrl?: string
  btcNative?: string
  btcPrivate?: string
}): Promise<RelayWalletConfig> => {
  const relayWif = getRequiredConfig(btcPrivate, `${CRYPTO_PRIVATE_CREDENTIALS_IDENTIFIER}.btcPrivate`)
  const destinationAddress = await getBitcoinDestinationAddress()

  const keyPair = ECPair.fromWIF(relayWif, bitcoin.networks.bitcoin)
  const p2wpkh = bitcoin.payments.p2wpkh({
    pubkey: Buffer.from(keyPair.publicKey),
    network: bitcoin.networks.bitcoin
  })

  if (!p2wpkh.address || !p2wpkh.output) {
    throw new Error('Unable to derive a relay source address from BTC key')
  }

  const configuredSourceAddress = btcNative

  if (
    configuredSourceAddress &&
    normalizeAddressForCompare(configuredSourceAddress) !== normalizeAddressForCompare(p2wpkh.address)
  ) {
    throw new Error('BTC_SRC must match the BTC relay private key derived SegWit address')
  }

  return {
    keyPair,
    signer: createPsbtSigner(keyPair),
    apiBaseUrl: normalizeApiBaseUrl(btcApiUrl ?? DEFAULT_MEMPOOL_API_BASE_URL),
    sourceAddress: p2wpkh.address,
    sourceScript: Buffer.from(p2wpkh.output),
    destinationAddress
  }
}

const estimateFee = (inputCount: number, outputCount: number, feeRateSatPerVb: number): bigint => {
  const transactionOverheadVbytes = 10
  const p2wpkhInputVbytes = 68
  const conservativeOutputVbytes = 43
  const estimatedVbytes =
    transactionOverheadVbytes + inputCount * p2wpkhInputVbytes + outputCount * conservativeOutputVbytes

  return BigInt(Math.ceil(estimatedVbytes * feeRateSatPerVb))
}

const getRecommendedFeeRate = async (apiBaseUrl: string): Promise<number> => {
  try {
    const fees = await fetchJson<MempoolFeesResponse>(apiBaseUrl, '/v1/fees/recommended')
    const candidateFeeRate = Number(fees.fastestFee ?? fees.halfHourFee ?? fees.hourFee ?? 0)
    if (!Number.isFinite(candidateFeeRate) || candidateFeeRate <= 0) {
      return DEFAULT_FEE_RATE_SAT_PER_VB
    }
    return Math.max(1, Math.min(500, Math.ceil(candidateFeeRate)))
  } catch {
    return DEFAULT_FEE_RATE_SAT_PER_VB
  }
}

const selectRelayUtxos = ({
  availableUtxos,
  relayAmountSats,
  feeRateSatPerVb
}: {
  availableUtxos: MempoolUtxo[]
  relayAmountSats: bigint
  feeRateSatPerVb: number
}): RelaySelection => {
  if (relayAmountSats < DUST_THRESHOLD_SATS) {
    throw new Error('Relay amount is too small to forward on Bitcoin')
  }

  const selectedUtxos: MempoolUtxo[] = []
  let totalInputSats = BigInt(0)

  const sortedUtxos = [...availableUtxos].sort((a, b) => b.value - a.value)

  for (const utxo of sortedUtxos) {
    selectedUtxos.push(utxo)
    totalInputSats += BigInt(utxo.value)

    const feeWithChange = estimateFee(selectedUtxos.length, 2, feeRateSatPerVb)
    if (totalInputSats >= relayAmountSats + feeWithChange) {
      break
    }
  }

  if (selectedUtxos.length === 0) {
    throw new Error('No UTXOs available for BTC relay source address')
  }

  const feeWithChange = estimateFee(selectedUtxos.length, 2, feeRateSatPerVb)
  const changeWithChangeOutput = totalInputSats - relayAmountSats - feeWithChange

  if (changeWithChangeOutput >= DUST_THRESHOLD_SATS) {
    return {
      utxos: selectedUtxos,
      totalInputSats,
      relayAmountSats,
      changeSats: changeWithChangeOutput
    }
  }

  const feeNoChange = estimateFee(selectedUtxos.length, 1, feeRateSatPerVb)
  const minimumRequired = relayAmountSats + feeNoChange
  if (totalInputSats < minimumRequired) {
    throw new Error('Insufficient BTC balance for relay payout and network fee')
  }

  return {
    utxos: selectedUtxos,
    totalInputSats,
    relayAmountSats,
    changeSats: BigInt(0)
  }
}

const findPaymentToSource = async ({
  apiBaseUrl,
  txid,
  sourceAddress
}: {
  apiBaseUrl: string
  txid: string
  sourceAddress: string
}): Promise<bigint> => {
  const sourceKey = normalizeAddressForCompare(sourceAddress)
  let tx: MempoolTx | null = null

  for (let attempt = 0; attempt < MAX_PAYMENT_LOOKUP_ATTEMPTS; attempt += 1) {
    try {
      tx = await fetchJson<MempoolTx>(apiBaseUrl, `/tx/${txid}`)
      break
    } catch {
      if (attempt === MAX_PAYMENT_LOOKUP_ATTEMPTS - 1) {
        throw new Error('Unable to fetch incoming BTC payment transaction')
      }
      await sleep(PAYMENT_LOOKUP_RETRY_DELAY_MS)
    }
  }

  if (!tx) {
    throw new Error('Payment transaction was not found')
  }

  const receivedSats = tx.vout.reduce((total, output) => {
    if (!output.scriptpubkey_address || output.value == null) {
      return total
    }

    return normalizeAddressForCompare(output.scriptpubkey_address) === sourceKey ? total + BigInt(output.value) : total
  }, BigInt(0))

  if (receivedSats <= BigInt(0)) {
    throw new Error('BTC payment was not sent to relay source address')
  }

  return receivedSats
}

const buildAndBroadcastRelayTransaction = async ({
  relayWallet,
  selection
}: {
  relayWallet: RelayWalletConfig
  selection: RelaySelection
}): Promise<string> => {
  const psbt = new bitcoin.Psbt({ network: bitcoin.networks.bitcoin })

  for (const utxo of selection.utxos) {
    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        script: relayWallet.sourceScript,
        value: toSatsNumber(utxo.value, 'relay UTXO value')
      }
    })
  }

  psbt.addOutput({
    address: relayWallet.destinationAddress,
    value: toSatsNumber(selection.relayAmountSats, 'relay amount')
  })

  if (selection.changeSats >= DUST_THRESHOLD_SATS) {
    psbt.addOutput({
      address: relayWallet.sourceAddress,
      value: toSatsNumber(selection.changeSats, 'relay change amount')
    })
  }

  psbt.signAllInputs(relayWallet.signer)
  psbt.finalizeAllInputs()

  const rawHex = psbt.extractTransaction().toHex()
  const broadcastedTxId = await fetchText(relayWallet.apiBaseUrl, '/tx', {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: rawHex
  })

  if (!/^[a-fA-F0-9]{64}$/.test(broadcastedTxId)) {
    throw new Error('Unexpected relay broadcast transaction id')
  }

  return broadcastedTxId.toLowerCase()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid Bitcoin relay request payload' }, { status: 400 })
    }

    const { paymentHash: rawPaymentHash, paymentUsdCents, relayUsdCents } = parsed.data
    const paymentTxId = normalizeTxId(rawPaymentHash)
    const paymentHash = `0x${paymentTxId}` as `0x${string}`

    const existingRelayHash = relayedHashes.get(paymentTxId)
    if (existingRelayHash) {
      return NextResponse.json({
        success: true,
        paymentHash,
        relayHash: existingRelayHash,
        alreadyRelayed: true
      })
    }

    const cryptoCredentials = await getBitcoinRelayCredentials().catch(() => null)

    if (cryptoCredentials && !cryptoCredentials.enabled) {
      return NextResponse.json({ error: 'Relay is disabled for Bitcoin' }, { status: 503 })
    }

    const relayWallet = await getRelayWalletConfig({
      btcApiUrl: cryptoCredentials?.btcApiUrl ?? process.env.BITCOIN_RELAY_API_BASE_URL,
      btcNative: cryptoCredentials?.btcNative ?? process.env.SRC_B,
      btcPrivate: cryptoCredentials?.btcPrivate ?? process.env.B
    })
    const receivedAmountSats = await findPaymentToSource({
      apiBaseUrl: relayWallet.apiBaseUrl,
      txid: paymentTxId,
      sourceAddress: relayWallet.sourceAddress
    })

    const relayAmountSats = computeRelayAmountSats({
      receivedAmountSats,
      paymentUsdCents,
      relayUsdCents
    })
    if (relayAmountSats <= BigInt(0)) {
      return NextResponse.json({ error: 'Relay amount is zero; relay aborted' }, { status: 400 })
    }

    const sourceUtxos = await fetchJson<MempoolUtxo[]>(
      relayWallet.apiBaseUrl,
      `/address/${encodeURIComponent(relayWallet.sourceAddress)}/utxo`
    )
    if (!Array.isArray(sourceUtxos) || sourceUtxos.length === 0) {
      return NextResponse.json({ error: 'No relay UTXOs available for BTC source address' }, { status: 400 })
    }

    const feeRateSatPerVb = await getRecommendedFeeRate(relayWallet.apiBaseUrl)
    const selection = selectRelayUtxos({
      availableUtxos: sourceUtxos,
      relayAmountSats,
      feeRateSatPerVb
    })

    const relayTxId = await buildAndBroadcastRelayTransaction({
      relayWallet,
      selection
    })

    const relayHash = `0x${relayTxId}` as `0x${string}`
    relayedHashes.set(paymentTxId, relayHash)

    return NextResponse.json({
      success: true,
      paymentHash,
      relayHash,
      relayFeeBps: 0,
      receivedAmountSats: receivedAmountSats.toString(),
      relayAmountSats: relayAmountSats.toString(),
      paymentUsdCents: paymentUsdCents ?? null,
      relayUsdCents: relayUsdCents ?? null,
      sourceAddress: relayWallet.sourceAddress,
      destinationAddress: relayWallet.destinationAddress,
      feeRateSatPerVb,
      selectedUtxoCount: selection.utxos.length
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Relay target exceeds the original payment amount') {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.error('Bitcoin relay forwarding error:', error)
    return NextResponse.json(
      {
        error: 'Bitcoin relay forwarding failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
