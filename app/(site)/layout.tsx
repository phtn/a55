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
        {/* 
          Critical theme script - must run before React hydrates to prevent FOUC.
          Using dangerouslySetInnerHTML on next/script avoids React 19's warning
          about <script> tags as component children.
          See: rendering-hydration-no-flicker rule in Vercel best practices.
        */}
        <Script
          id='theme-script'
          strategy='beforeInteractive'
          dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }}
        />
        <RootProviders>
          {children}
          <FooterSection />
        </RootProviders>
      </body>
    </html>
  )
}
