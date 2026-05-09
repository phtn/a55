import { useEffect, useState } from 'react'

interface UseApiOptions {
  refreshInterval?: number
}

interface UseApiResult<T> {
  data: T | null
  error: string | null
  isLoading: boolean
}

export const useApi = <T,>(
  url: string,
  options: UseApiOptions = {}
): UseApiResult<T> => {
  const { refreshInterval } = options
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isCancelled = false

    const fetchData = async (initialLoad = false) => {
      if (initialLoad) {
        setIsLoading(true)
      }

      try {
        const response = await fetch(url, {
          cache: 'no-store'
        })

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }

        const nextData = (await response.json()) as T

        if (isCancelled) {
          return
        }

        setData(nextData)
        setError(null)
      } catch (nextError) {
        if (isCancelled) {
          return
        }

        setError(
          nextError instanceof Error ? nextError.message : 'Unknown error'
        )
      } finally {
        if (!isCancelled && initialLoad) {
          setIsLoading(false)
        }
      }
    }

    fetchData(true)

    if (!refreshInterval) {
      return () => {
        isCancelled = true
      }
    }

    const intervalId = window.setInterval(() => {
      void fetchData()
    }, refreshInterval)

    return () => {
      isCancelled = true
      window.clearInterval(intervalId)
    }
  }, [refreshInterval, url])

  return {
    data,
    error,
    isLoading
  }
}
