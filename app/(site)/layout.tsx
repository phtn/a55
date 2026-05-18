import { FooterSection } from '@/components/footer'
import { RootProviders } from '@/components/root-providers'
import { rootHtmlClassName, siteMetadata } from '@/lib/root-layout'
import { THEME_SCRIPT } from '@/lib/theme'
import type { Metadata } from 'next'
import Script from 'next/script'
import type { ReactNode } from 'react'
import '../globals.css'

export const metadata: Metadata = siteMetadata

export default function SiteRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='en' suppressHydrationWarning className={rootHtmlClassName}>
      <body className='min-h-full flex flex-col'>
        <Script id='theme-script' strategy='beforeInteractive'>
          {THEME_SCRIPT}
        </Script>
        <RootProviders>
          {children}
          <FooterSection />
        </RootProviders>
      </body>
    </html>
  )
}
