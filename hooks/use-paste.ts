import {useCallback, useEffect, useState} from 'react'

interface UsePasteOptions {
  timeout?: number
}

interface UsePasteReturn {
  paste: () => Promise<string | null>
  pastedText: string | null
  isPasting: boolean
  pasted: boolean
  error: Error | null
}

export function usePaste({
  timeout = 2000,
}: UsePasteOptions = {}): UsePasteReturn {
  const [pastedText, setPastedText] = useState<string | null>(null)
  const [isPasting, setIsPasting] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [pasted, setPasted] = useState(false)
  const [pasteCount, setPasteCount] = useState(0)

  const paste = useCallback(async (): Promise<string | null> => {
    setIsPasting(true)
    setError(null)

    try {
      const text = await navigator.clipboard.readText()
      setPastedText(text)
      setPasted(true)
      setPasteCount((count) => count + 1)

      return text
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Failed to read from clipboard')
      setError(error)
      console.error('Failed to paste:', error)
      return null
    } finally {
      setIsPasting(false)
    }
  }, [])

  useEffect(() => {
    if (!pasteCount) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setPasted(false)
    }, timeout)

    return () => window.clearTimeout(timeoutId)
  }, [pasteCount, timeout])

  return {paste, pastedText, isPasting, pasted, error}
}
