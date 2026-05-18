'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'

interface ExchangeRateQuote {
  base: string
  quote: string
  rate: number
  sourceSymbol: string
  lastUpdated: string | null
}

interface ExchangeRateApiResponse {
  success: boolean
  data: ExchangeRateQuote | null
  timestamp: string
  error?: string
}

interface UseExchangeRateOptions {
  autoFetch?: boolean
  pollInterval?: number
}

interface UseExchangeRateReturn {
  data: ExchangeRateQuote | null
  error: string | null
  isPending: boolean
  lastUpdated: string | null
  refetch: () => void
}

export function useExchangeRate(base: string, quote: string, options: UseExchangeRateOptions = {}): UseExchangeRateReturn {
  const { autoFetch = true, pollInterval = 60_000 } = options
  const [data, setData] = useState<ExchangeRateQuote | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const fetchExchangeRate = useCallback(() => {
    const params = new URLSearchParams({
      base: base.toUpperCase(),
      quote: quote.toUpperCase()
    })

    startTransition(async () => {
      try {
        const response = await fetch(`/api/exchange-rate?${params}`)
        const result = (await response.json()) as ExchangeRateApiResponse

        if (!response.ok || !result.success || !result.data) {
          setError(result.error ?? `Failed to fetch ${base}/${quote} exchange rate`)
          return
        }

        setData(result.data)
        setLastUpdated(result.data.lastUpdated ?? result.timestamp)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : `Failed to fetch ${base}/${quote} exchange rate`)
      }
    })
  }, [base, quote])

  useEffect(() => {
    if (autoFetch) {
      fetchExchangeRate()
    }
  }, [autoFetch, fetchExchangeRate])

  useEffect(() => {
    if (pollInterval <= 0) return

    const intervalId = setInterval(fetchExchangeRate, pollInterval)
    return () => clearInterval(intervalId)
  }, [fetchExchangeRate, pollInterval])

  return {
    data,
    error,
    isPending,
    lastUpdated,
    refetch: fetchExchangeRate
  }
}
