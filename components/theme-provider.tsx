'use client'

import {
  THEME_MEDIA_QUERY,
  THEME_STORAGE_KEY,
  isResolvedTheme,
  isTheme,
  resolveTheme,
  type ResolvedTheme,
  type Theme,
} from '@/lib/theme'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

interface ThemeContextValue {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readStoredTheme(): Theme {
  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    return isTheme(storedTheme) ? storedTheme : 'system'
  } catch {
    return 'system'
  }
}

function getPreferredTheme(): ResolvedTheme {
  return resolveTheme(
    'system',
    typeof window.matchMedia === 'function' && window.matchMedia(THEME_MEDIA_QUERY).matches
  )
}

function applyTheme(theme: Theme): ResolvedTheme {
  const resolvedTheme = resolveTheme(theme, getPreferredTheme() === 'dark')
  const root = document.documentElement

  root.dataset.theme = resolvedTheme
  root.dataset.themePreference = theme
  root.style.colorScheme = resolvedTheme
  root.classList.toggle('dark', resolvedTheme === 'dark')
  root.classList.toggle('light', resolvedTheme === 'light')

  return resolvedTheme
}

function persistTheme(theme: Theme) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {}
}

function getInitialTheme(): Theme {
  if (typeof document === 'undefined') {
    return 'system'
  }

  return isTheme(document.documentElement.dataset.themePreference)
    ? document.documentElement.dataset.themePreference
    : readStoredTheme()
}

function getInitialResolvedTheme(): ResolvedTheme {
  if (typeof document === 'undefined') {
    return 'light'
  }

  return isResolvedTheme(document.documentElement.dataset.theme)
    ? document.documentElement.dataset.theme
    : applyTheme(getInitialTheme())
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(getInitialResolvedTheme)

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      return
    }

    const mediaQuery = window.matchMedia(THEME_MEDIA_QUERY)

    const syncSystemTheme = () => {
      if (document.documentElement.dataset.themePreference !== 'system') {
        return
      }

      setResolvedTheme(applyTheme('system'))
      setThemeState('system')
    }

    mediaQuery.addEventListener('change', syncSystemTheme)

    return () => mediaQuery.removeEventListener('change', syncSystemTheme)
  }, [])

  function setTheme(theme: Theme) {
    persistTheme(theme)
    setThemeState(theme)
    setResolvedTheme(applyTheme(theme))
  }

  return <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }

  return context
}
