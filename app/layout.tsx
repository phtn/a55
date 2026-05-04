import { FooterSection } from '@/components/footer'
import { ThemeProvider } from '@/components/theme-provider'
import { THEME_SCRIPT } from '@/lib/theme'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'
import { Figtree, Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const figtree = Figtree({ subsets: ['latin'], variable: '--font-sans' })

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: 'Bridge',
  description: 'Bridge starter app'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang='en'
      suppressHydrationWarning
      className={cn('h-full', 'antialiased', geistSans.variable, geistMono.variable, figtree.variable, 'font-display')}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className='min-h-full flex flex-col'>
        <ThemeProvider>
          {children}
          <FooterSection />
        </ThemeProvider>
      </body>
    </html>
  )
}
