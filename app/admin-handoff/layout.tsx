import { rootHtmlClassName } from '@/lib/root-layout'
import { THEME_SCRIPT } from '@/lib/theme'
import Script from 'next/script'
import type { ReactNode } from 'react'
import '../globals.css'

/**
 * Minimal root layout for the admin handoff interstitial.
 *
 * This page is served via passthrough on the admin subdomain (and as a fallback on the main domain).
 * It must provide its own <html> and <body> because it lives at the root level
 * (outside of both the (site) and (admin) route groups).
 *
 * Includes the critical theme script so the handoff screen respects the user's
 * light/dark preference without flashing.
 */
export default function AdminHandoffLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='en' suppressHydrationWarning className={rootHtmlClassName}>
      <body className='min-h-screen bg-background text-foreground'>
        <Script
          id='theme-script-handoff'
          strategy='beforeInteractive'
          dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }}
        />
        {children}
      </body>
    </html>
  )
}
