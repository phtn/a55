import { useCallback, useEffect, useRef, useState } from 'react'

interface UseCopyOptions {
  timeout?: number
}

interface UseCopyReturn {
  copy: (label: string, text: string) => void
  copied: boolean
}

export function useCopy({ timeout = 2000 }: UseCopyOptions = {}): UseCopyReturn {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const copy = useCallback(
    async (label: string, text: string) => {
      try {
        await navigator.clipboard.writeText(text)

        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }

        setCopied(true)

        // Set timeout to reset copied state
        timeoutRef.current = setTimeout(() => {
          setCopied(false)
          timeoutRef.current = null
        }, timeout)
      } catch (error) {
        console.error('Failed to copy:', error)
      }
    },
    [timeout]
  )

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return { copy, copied }
}
