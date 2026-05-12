'use client'
import { useCallback, useMemo } from 'react'
import { type Address, type Chain, formatEther, isAddress, parseEther } from 'viem'
import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi'
import { useCrypto } from './use-crypto'

interface SendParams {
  /** Recipient address. Defaults to a predefined address if not provided. */
  to?: Address
  /** Amount in USD to send */
  usd: number
  /** Optional chain ID for the transaction */
  chainId?: Chain['id']
}

interface UseSendReturn {
  /** Send a transaction with USD amount */
  send: (params: SendParams) => void
  /** Current ETH price in USD */
  ethPrice: number | null
  /** Transaction state from wagmi - true when waiting for wallet confirmation */
  isPending: boolean
  /** True when waiting for on-chain confirmation */
  isConfirming: boolean
  /** Transaction error, if any */
  error: Error | null
  /** Transaction hash, if successful */
  hash: `0x${string}` | undefined
  /** Transaction receipt, if confirmed */
  receipt: { blockNumber: bigint; status: 'success' | 'reverted' } | null
  /** Convert ETH amount (in wei) to USD */
  ethToUsd: (eth: bigint) => number | null
  /** Convert USD amount to ETH (returns string for parseEther) */
  usdToEth: (usd: number) => string | null
}

const MIN_USD_AMOUNT = 0.01
const RECEIPT_RETRY_DELAY_MS = (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 5000)
const RECEIPT_REFETCH_INTERVAL_MS = (query: { state: { data: unknown } }): number | false => {
  // Stop polling once we have a receipt
  if (query.state.data) {
    return false
  }
  // Poll every 2 seconds while waiting
  return 2000
}

/**
 * Hook for sending ETH transactions with USD amount conversion.
 * Uses real-time ETH price from the crypto API when available.
 */
export const useSend = (): UseSendReturn => {
  const { getBySymbol } = useCrypto()
  const { mutate, isPending, error, data: transactionHash } = useSendTransaction()

  const destination = useMemo<Address | undefined>(() => {
    const fallbackDestination = process.env.NEXT_PUBLIC_SRC_E
    if (fallbackDestination && isAddress(fallbackDestination)) {
      return fallbackDestination
    }

    return undefined
  }, [])

  // Wait for transaction receipt once we have a hash
  // Note: wagmi's useWaitForTransactionReceipt automatically cleans up the refetchInterval
  // when the component unmounts or when the query is disabled
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    isError: isReceiptError,
    error: receiptError,
    data: receipt,
    fetchStatus
  } = useWaitForTransactionReceipt({
    hash: transactionHash,
    query: {
      enabled: !!transactionHash,
      retry: 5,
      retryDelay: RECEIPT_RETRY_DELAY_MS,
      refetchInterval: RECEIPT_REFETCH_INTERVAL_MS
    }
  })

  // Get current ETH price
  const ethPrice = getBySymbol('ETH')?.price ?? null

  /**
   * Convert ETH amount (in wei) to USD
   */
  const ethToUsd = useCallback(
    (eth: bigint): number | null => {
      if (!ethPrice) return null
      const price = ethPrice
      const ethAmount = Number(formatEther(eth))
      return ethAmount * price
    },
    [ethPrice]
  )

  /**
   * Convert USD amount to ETH string (for use with parseEther)
   * Returns null if ETH price is not available
   */
  const usdToEth = useCallback(
    (usd: number): string | null => {
      if (!ethPrice) return null
      const ethAmount = usd / ethPrice
      // Use toFixed(18) to ensure we have enough precision for parseEther
      // parseEther can handle up to 18 decimal places
      return ethAmount.toFixed(18)
    },
    [ethPrice]
  )

  /**
   * Send a transaction with USD amount
   */
  const send = useCallback(
    (params: SendParams): void => {
      const { to = destination, usd, chainId } = params

      // Validate USD amount
      if (usd <= 0) {
        throw new Error('USD amount must be greater than 0')
      }

      if (usd < MIN_USD_AMOUNT) {
        throw new Error(`USD amount must be at least $${MIN_USD_AMOUNT}`)
      }

      if (!to) {
        throw new Error('Transaction destination is not configured')
      }

      // Convert USD to ETH
      const ethString = usdToEth(usd)
      if (!ethString) {
        throw new Error('Unable to convert USD to ETH: ETH price not available')
      }

      try {
        const value = parseEther(ethString)

        if (process.env.NODE_ENV === 'development') {
          if (!ethPrice) {
            console.warn('ETH price not available')
          }
          console.table({
            'USD Amount': `$${usd.toFixed(2)}`,
            'ETH Amount': ethString,
            'Wei Value': value.toString(),
            'ETH Price': `$${ethPrice?.toFixed(2)}`,
            Recipient: to
          })
        }

        mutate({
          to,
          value,
          chainId
        })
      } catch (err) {
        throw new Error(
          err instanceof Error
            ? `Failed to send transaction: ${err.message}`
            : 'Failed to send transaction: Unknown error'
        )
      }
    },
    [mutate, usdToEth, ethPrice, destination]
  )

  // Determine if we're still confirming - we have a hash but no receipt yet
  const isStillConfirming =
    !!transactionHash && !receipt && !isConfirmed && !isReceiptError && (isConfirming || fetchStatus === 'fetching')

  return {
    send,
    ethPrice,
    isPending,
    isConfirming: isStillConfirming,
    error: (error || receiptError) as Error | null,
    hash: transactionHash,
    receipt: receipt
      ? {
          blockNumber: receipt.blockNumber,
          status: receipt.status === 'success' ? 'success' : 'reverted'
        }
      : null,
    ethToUsd,
    usdToEth
  }
}

/**
 * Convert ETH amount (in wei) to USD using a static price.
 * @deprecated Use useSend().ethToUsd() for real-time prices
 */
export const eth_2_usd = (eth: bigint, price: number | null): number => {
  if (!price) {
    console.warn('ETH price not available')
    return 0
  }
  const ethAmount = Number(formatEther(eth))
  return ethAmount * price
}
