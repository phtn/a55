export const THEME_STORAGE_KEY = 'bridge-theme'
export const THEME_MEDIA_QUERY = '(prefers-color-scheme: dark)'

export const THEMES = ['light', 'dark', 'system'] as const

export type Theme = (typeof THEMES)[number]
export type ResolvedTheme = Exclude<Theme, 'system'>

export function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark' || value === 'system'
}

export function isResolvedTheme(value: unknown): value is ResolvedTheme {
  return value === 'light' || value === 'dark'
}

export function resolveTheme(theme: Theme, prefersDark: boolean): ResolvedTheme {
  if (theme === 'system') {
    return prefersDark ? 'dark' : 'light'
  }

  return theme
}

export const THEME_SCRIPT = `
(() => {
  const storageKey = '${THEME_STORAGE_KEY}';
  const mediaQuery = '${THEME_MEDIA_QUERY}';
  const root = document.documentElement;
  const isTheme = (value) => value === 'light' || value === 'dark' || value === 'system';
  const getPreferredTheme = () =>
    typeof window.matchMedia === 'function' && window.matchMedia(mediaQuery).matches ? 'dark' : 'light';
  const resolveTheme = (theme) => (theme === 'system' ? getPreferredTheme() : theme);
  const applyTheme = (theme) => {
    const resolvedTheme = resolveTheme(theme);
    root.dataset.theme = resolvedTheme;
    root.dataset.themePreference = theme;
    root.style.colorScheme = resolvedTheme;
    root.classList.toggle('dark', resolvedTheme === 'dark');
    root.classList.toggle('light', resolvedTheme === 'light');
  };

  try {
    const storedTheme = window.localStorage.getItem(storageKey);
    applyTheme(isTheme(storedTheme) ? storedTheme : 'system');
  } catch {
    applyTheme('system');
  }
})();
`.trim()
