import { FooterSection } from '@/components/footer'
import { ThemeProvider } from '@/components/theme-provider'
import { THEME_SCRIPT } from '@/lib/theme'
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
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
