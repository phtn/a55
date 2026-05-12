'use client'

import type {BitcoinConnector} from '@reown/appkit-adapter-bitcoin'
import {useAppKitProvider} from '@reown/appkit/react'
import {useCallback, useState} from 'react'

type BitcoinTransferRequestParams = {
  recipient: string
  amount: string
}

type BitcoinRpcProvider = {
  request: <T>(args: {
    method: string
    params?: readonly unknown[] | object
  }) => Promise<T>
}

type BitcoinWalletProvider = Pick<BitcoinConnector, 'sendTransfer'> &
  Partial<BitcoinRpcProvider>

type BitcoinReceipt = {blockNumber: bigint; status: 'success' | 'reverted'}

const BITCOIN_TX_ID_PATTERN = /^[a-fA-F0-9]{64}$/

const normalizeTxHash = (value: string): `0x${string}` => {
  const stripped = value.startsWith('0x') ? value.slice(2) : value
  if (!BITCOIN_TX_ID_PATTERN.test(stripped)) {
    throw new Error('Bitcoin transfer returned an invalid transaction id')
  }
  return `0x${stripped}` as `0x${string}`
}

const sendTransfer = async (
  provider: BitcoinWalletProvider,
  params: BitcoinTransferRequestParams,
): Promise<string> => {
  if (typeof provider.sendTransfer === 'function') {
    return provider.sendTransfer(params)
  }

  if (typeof provider.request !== 'function') {
    throw new Error('Bitcoin wallet provider does not support sendTransfer')
  }

  try {
    return await provider.request<string>({
      method: 'sendTransfer',
      params,
    })
  } catch {
    return await provider.request<string>({
      method: 'sendTransfer',
      params: [params],
    })
  }
}

export interface BitcoinTransferResult {
  send: (params: {recipient: string; amountSats: bigint}) => Promise<void>
  isReady: boolean
  isPending: boolean
  isConfirming: boolean
  hash: `0x${string}` | undefined
  receipt: BitcoinReceipt | null
  error: Error | null
  reset: () => void
}

export function useBitcoinTransfer(): BitcoinTransferResult {
  const {walletProvider} = useAppKitProvider<BitcoinWalletProvider | undefined>(
    'bip122',
  )
  const [isPending, setIsPending] = useState(false)
  const [hash, setHash] = useState<`0x${string}` | undefined>(undefined)
  const [receipt, setReceipt] = useState<BitcoinReceipt | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const reset = useCallback(() => {
    setHash(undefined)
    setReceipt(null)
    setError(null)
  }, [])

  const send = useCallback(
    async ({recipient, amountSats}: {recipient: string; amountSats: bigint}) => {
      if (!walletProvider) {
        throw new Error('Bitcoin wallet provider is not connected')
      }

      if (amountSats <= BigInt(0)) {
        throw new Error('Bitcoin amount must be greater than zero')
      }

      setIsPending(true)
      setHash(undefined)
      setReceipt(null)
      setError(null)

      try {
        const txid = await sendTransfer(walletProvider, {
          recipient,
          amount: amountSats.toString(),
        })

        const normalizedHash = normalizeTxHash(txid)
        setHash(normalizedHash)
        setReceipt({blockNumber: BigInt(0), status: 'success'})
      } catch (err) {
        setReceipt({blockNumber: BigInt(0), status: 'reverted'})
        setError(
          err instanceof Error
            ? err
            : new Error('Bitcoin transfer failed unexpectedly'),
        )
        throw err
      } finally {
        setIsPending(false)
      }
    },
    [walletProvider],
  )

  return {
    send,
    isReady: Boolean(walletProvider),
    isPending,
    isConfirming: false,
    hash,
    receipt,
    error,
    reset,
  }
}
