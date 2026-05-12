'use client'

import { mainnet } from '@reown/appkit/networks'
import { createAppKit } from '@reown/appkit/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'
import { bitcoinAdapter, networks, projectId, wagmiAdapter } from './config'

const VALID_WUI_ICON_SIZES = new Set(['xxs', 'xs', 'sm', 'md', 'mdl', 'lg', 'xl', 'xxl', 'inherit'])

const PHOSPHOR_ICON_NAMES = new Set([
  'add',
  'allWallets',
  'arrowBottom',
  'arrowBottomCircle',
  'arrowClockWise',
  'arrowLeft',
  'arrowRight',
  'arrowTop',
  'arrowTopRight',
  'bank',
  'bin',
  'browser',
  'card',
  'checkmarkBold',
  'chevronBottom',
  'chevronLeft',
  'chevronRight',
  'chevronTop',
  'clock',
  'close',
  'coinPlaceholder',
  'compass',
  'copy',
  'desktop',
  'dollar',
  'download',
  'exclamationCircle',
  'extension',
  'externalLink',
  'filters',
  'helpCircle',
  'id',
  'image',
  'info',
  'lightbulb',
  'mail',
  'mobile',
  'more',
  'networkPlaceholder',
  'nftPlaceholder',
  'plus',
  'power',
  'qrCode',
  'questionMark',
  'refresh',
  'recycleHorizontal',
  'search',
  'sealCheck',
  'send',
  'signOut',
  'spinner',
  'swapHorizontal',
  'swapVertical',
  'threeDots',
  'user',
  'verify',
  'verifyFilled',
  'wallet',
  'warning',
  'warningCircle'
])

const patchWuiIconSizeBug = () => {
  if (typeof window === 'undefined') return

  const applyPatch = () => {
    const WuiIcon = customElements.get('wui-icon') as
      | (new () => HTMLElement & { size?: string; name?: string })
      | undefined
    if (!WuiIcon) return false

    const prototypeWithPatch = WuiIcon.prototype as HTMLElement & {
      size?: string
      name?: string
      render?: (...args: unknown[]) => unknown
      __hyfePatchedPhosphorSize?: boolean
    }

    if (prototypeWithPatch.__hyfePatchedPhosphorSize) return true
    const originalRender = prototypeWithPatch.render
    if (typeof originalRender !== 'function') return false

    prototypeWithPatch.render = function (...args: unknown[]) {
      const iconName = this.name ?? ''
      const iconSize = this.size ?? 'md'

      if (!VALID_WUI_ICON_SIZES.has(iconSize)) {
        this.size = 'md'
      } else if (iconSize === 'inherit' && PHOSPHOR_ICON_NAMES.has(iconName)) {
        // AppKit UI maps these to phosphor webcomponents, which don't accept "inherit".
        this.size = 'md'
      }

      return originalRender.apply(this, args)
    }

    prototypeWithPatch.__hyfePatchedPhosphorSize = true
    return true
  }

  if (applyPatch()) return
  void customElements.whenDefined('wui-icon').then(() => {
    void applyPatch()
  })
}

patchWuiIconSizeBug()

// Set up queryClient
const queryClient = new QueryClient()

if (!projectId) {
  throw new Error('Project ID is not defined')
}

// Set up metadata
const metadata = {
  name: 'tx-hash',
  description: 'stake-street',
  url: process.env.NODE_ENV === 'production' ? 'https://localhost:3001' : 'http://localhost:3000', // origin must match your domain & subdomain
  icons: ['/icons/69.svg']
}

// Create the modal
export const modal = createAppKit({
  adapters: [wagmiAdapter, bitcoinAdapter],
  projectId,
  networks,
  defaultNetwork: mainnet,
  metadata: metadata,
  features: {
    analytics: false, // set true when Reown Cloud domain allowlist is configured
    emailShowWallets: true
  },
  themeMode: 'dark'
})

function WagmiContext({ children, cookies }: { children: ReactNode; cookies?: string | null }) {
  const initialState =
    typeof cookies === 'string' ? cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies) : undefined

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}

export default WagmiContext
