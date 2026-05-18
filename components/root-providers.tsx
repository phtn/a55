import { ThemeProvider } from '@/components/theme-provider'
import WagmiContext from '@/ctx/wagmi'
import type { ReactNode } from 'react'

export function RootProviders({ children }: { children: ReactNode }) {
  return (
    <WagmiContext>
      <ThemeProvider>{children}</ThemeProvider>
    </WagmiContext>
  )
}
