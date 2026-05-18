import { cn } from '@/lib/utils'
import type { Metadata } from 'next'
import { Figtree, Geist, Geist_Mono } from 'next/font/google'

const figtree = Figtree({ subsets: ['latin'], variable: '--font-sans' })

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
})

export const siteMetadata: Metadata = {
  title: 'Stake Street',
  description: 'Fund, Transfer, Stake and Bet'
}

export const rootHtmlClassName = cn(
  'h-full',
  'antialiased',
  geistSans.variable,
  geistMono.variable,
  figtree.variable,
  'font-display'
)
