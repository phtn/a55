import { RootProviders } from '@/components/root-providers'
import { rootHtmlClassName } from '@/lib/root-layout'
import { THEME_SCRIPT } from '@/lib/theme'
import Script from 'next/script'
import type { ReactNode } from 'react'
import '../globals.css'

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='en' suppressHydrationWarning className={rootHtmlClassName}>
      <body className='min-h-full flex flex-col'>
        <Script id='theme-script' strategy='beforeInteractive'>
          {THEME_SCRIPT}
        </Script>
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  )
}
