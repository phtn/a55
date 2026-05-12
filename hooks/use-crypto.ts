import type { CryptoApiResponse, CryptoQuote } from '@/lib/cmc/types'
import { useCallback, useEffect, useState, useTransition } from 'react'

interface UseCryptoOptions {
  /** Automatically fetch on mount. Default: true */
  autoFetch?: boolean
  /** Number of ranked assets to fetch from CoinMarketCap. Default: 25 */
  limit?: number
  /** Append wallet network tokens such as MATIC/POL when missing. Default: true */
  includeNetworkTokens?: boolean
  /** Polling interval in ms. Set to 0 to disable. Default: 0 */
  pollInterval?: number
}

interface UseCryptoReturn {
  /** Array of cryptocurrency quotes */
  data: CryptoQuote[]
  /** Loading state using React's useTransition */
  isPending: boolean
  /** Error message if fetch failed */
  error: string | null
  /** Timestamp of last successful fetch */
  lastUpdated: string | null
  /** Trigger a refetch */
  refetch: () => void
  /** Get a single crypto by symbol (case-insensitive) */
  getBySymbol: (symbol: string) => CryptoQuote | null
}

export function useCrypto(options: UseCryptoOptions = {}): UseCryptoReturn {
  const { autoFetch = true, includeNetworkTokens = true, limit = 25, pollInterval = 0 } = options

  const [data, setData] = useState<CryptoQuote[]>([])
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const fetchCrypto = useCallback(() => {
    startTransition(async () => {
      try {
        const params = new URLSearchParams({
          includeNetworkTokens: String(includeNetworkTokens),
          limit: String(limit)
        })
        const response = await fetch(`/api/crypto/quotes?${params}`)
        const result: CryptoApiResponse = await response.json()

        if (result.success) {
          setData(result.data)
          setLastUpdated(result.timestamp)
          setError(null)
        } else {
          setError(result.error ?? 'Failed to fetch cryptocurrency data')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      }
    })
  }, [includeNetworkTokens, limit])

  const getBySymbol = useCallback(
    (symbol: string): CryptoQuote | null => {
      const upperSymbol = symbol.toUpperCase()
      return data.find((crypto) => crypto.symbol.toUpperCase() === upperSymbol) ?? null
    },
    [data]
  )

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchCrypto()
    }
  }, [autoFetch, fetchCrypto])

  // Polling
  useEffect(() => {
    if (pollInterval <= 0) return

    const intervalId = setInterval(fetchCrypto, pollInterval)
    return () => clearInterval(intervalId)
  }, [pollInterval, fetchCrypto])

  return {
    data,
    isPending,
    error,
    lastUpdated,
    refetch: fetchCrypto,
    getBySymbol
  }
}
