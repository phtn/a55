'use client'
import { Icon } from '@/lib/icons'
import { LogoNameType } from '@/lib/icons/logos'
import { getPathnamePageTitle } from '@/lib/page-titles'
import { cn } from '@/lib/utils'
import { useAppKit, useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react'
import { usePathname, useRouter } from 'next/navigation'
import { Activity, ChangeEvent, Ref, SubmitEvent, useCallback, useEffect, useRef, useState } from 'react'
import { PixelGrid } from 'three-px-react'
import { usePageTitle } from './page-title-provider'
import { Typewrite } from './text/typewriter'
import { useTheme } from './theme-provider'
import { ThemeToggle } from './theme-toggle'
import { Button } from './ui/button'

const normalizeWebsiteUrl = (website: string) => {
  if (/^https?:\/\//i.test(website)) {
    return website
  }

  return `https://${website}`
}

const getWebsiteLabel = (website: string) => {
  try {
    return new URL(normalizeWebsiteUrl(website)).hostname.replace(/^www\./, '')
  } catch {
    return website
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '')
  }
}

const normalizeWalletAddress = (address: string | null | undefined) => {
  if (!address) return null
  return address.includes(':') ? (address.split(':').at(-1) ?? address) : address
}

const formatWalletAddress = (address: string | null) => {
  if (!address) return 'Connect'
  if (address.length <= 12) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

interface TopBarProps {
  companyWebsite?: string | null
}

export const TopBar = ({ companyWebsite: companyWebsiteProp = null }: TopBarProps) => {
  const [query, setQuery] = useState('')
  const navigate = useRouter()
  const pathname = usePathname()
  const { open: openAppKit } = useAppKit()
  const { caipNetwork } = useAppKitNetwork()
  const { address: evmWalletAddress, isConnected: isEvmWalletConnected } = useAppKitAccount({
    namespace: 'eip155'
  })
  const { address: bitcoinWalletAddress, isConnected: isBitcoinWalletConnected } = useAppKitAccount({
    namespace: 'bip122'
  })
  const { title, website } = usePageTitle()
  const { resolvedTheme } = useTheme()
  const pageTitle = title ?? getPathnamePageTitle(pathname ?? '')
  const companyWebsite = companyWebsiteProp ?? website
  const websiteUrl = companyWebsite ? normalizeWebsiteUrl(companyWebsite) : null
  const websiteLabel = companyWebsite ? getWebsiteLabel(companyWebsite) : null

  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const activeChainNamespace = caipNetwork?.chainNamespace
  const connectedNamespace =
    activeChainNamespace === 'bip122' && isBitcoinWalletConnected
      ? 'bip122'
      : activeChainNamespace === 'eip155' && isEvmWalletConnected
        ? 'eip155'
        : isEvmWalletConnected
          ? 'eip155'
          : isBitcoinWalletConnected
            ? 'bip122'
            : null
  const connectedAddress =
    connectedNamespace === 'bip122'
      ? normalizeWalletAddress(bitcoinWalletAddress)
      : normalizeWalletAddress(evmWalletAddress)
  const walletButtonLabel = formatWalletAddress(connectedAddress)
  const isWalletConnected = connectedNamespace !== null

  const handleSearch = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (query.trim()) {
      navigate.push(`/company/${query.trim().toUpperCase()}`)
      setQuery('')
    }
  }
  const handleSearchQueryChange = (e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)
  const handleWalletConnectorClick = useCallback(async () => {
    try {
      if (isWalletConnected) {
        await openAppKit({ view: 'Account' })
        return
      }

      await openAppKit({ view: 'Connect' })
    } catch (error) {
      console.error('Failed to open wallet modal', { error })
    }
  }, [isWalletConnected, openAppKit])

  // Focus search input on '/' key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is already typing in an input or textarea
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      if (e.key === '/') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <header className='sticky top-0 z-50 bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70'>
      <div className='h-16 border-b-[0.5px] border-border border-dotted'>
        <div id='primary' className='flex h-full max-w-7xl items-center'>
          <div className='flex w-full items-center justify-between gap-8'>
            <div className='flex px-8 items-center w-full'>
              {/*<StreetHeader resolvedTheme={resolvedTheme} />*/}
              <Typewrite
                id='page-title'
                text={pageTitle}
                showCursor={false}
                speed={22}
                className='truncate font-display font-medium text-foreground/90 text-sm md:text-xl tracking-[0.02em] leading-4 text-balance max-w-[18ch] md:max-w-[32ch] sm:line-clamp-2 xl:max-w-[6ch] xl:whitespace-nowrap xl:line-clamp-none'
              />
            </div>
            {websiteUrl && websiteLabel && (
              <a
                id='company-website-link'
                href={websiteUrl}
                target='_blank'
                rel='noreferrer'
                className='flex items-center font-display font-thin text-sm text-foreground/80 hover:text-foreground hover:underline underline-offset-3 decoration-dotted decoration-foreground/50 tracking-wider'>
                <span>{websiteLabel}</span>
                <Icon name='arrow-right' className='size-3 -rotate-23' />
              </a>
            )}

            <StreetToolbar
              websiteLabel={websiteLabel}
              websiteUrl={websiteUrl}
              searchInputRef={searchInputRef}
              handleSearch={handleSearch}
              handleSearchQueryChange={handleSearchQueryChange}
              searchQuery={query}
              handleConnect={handleWalletConnectorClick}
              isWalletConnected={isWalletConnected}
              walletButtonLabel={walletButtonLabel}
            />
          </div>
        </div>
      </div>
    </header>
  )
}

interface TopbarHeader {
  route?: string
  resolvedTheme: 'dark' | 'light'
}

export const StreetHeader = ({ route, resolvedTheme }: TopbarHeader) => {
  return (
    <div className='flex items-center justify-center size-5 aspect-square'>
      {route !== 'bets' ? (
        <Icon
          name={route as LogoNameType}
          className='size-6 md:size-6 text-foreground/80 bg-linear-to-l from-background/80 via-background to-transparent'
        />
      ) : (
        <PixelGrid
          animation='snake'
          color={resolvedTheme === 'dark' ? '#f5f5f5' : '#CCC'}
          className='md:scale-96 scale-85'
          duration={1200}
        />
      )}
    </div>
  )
}

interface StreetToolbarProps {
  websiteUrl: string | null
  websiteLabel: string | null
  searchInputRef: Ref<HTMLInputElement>
  handleSearch: (e: SubmitEvent<HTMLFormElement>) => void
  handleSearchQueryChange: (e: ChangeEvent<HTMLInputElement>) => void
  searchQuery: string
  handleConnect: VoidFunction
  isWalletConnected: boolean
  walletButtonLabel: string
}
export const StreetToolbar = ({
  websiteLabel,
  websiteUrl,
  searchInputRef,
  searchQuery,
  handleSearchQueryChange,
  handleSearch,
  handleConnect,
  isWalletConnected,
  walletButtonLabel
}: StreetToolbarProps) => {
  return (
    <div className='flex items-center'>
      <div className='shrink-0'>
        <Button
          id='wallet-connector'
          type='button'
          onClick={handleConnect}
          className={cn('font-display text-sm flex items-center gap-2 rounded-md', {
            'tracking-wider': isWalletConnected
          })}>
          {isWalletConnected && <span className='size-2 rounded-full bg-background' aria-hidden />}
          <span>{walletButtonLabel}</span>
          <Activity mode={isWalletConnected ? 'hidden' : 'visible'}>
            <Icon name='two-way' />
          </Activity>
        </Button>
      </div>
      <div className='flex items-center space-x-8'>
        <div className='h-6 w-16 flex items-center justify-center'>
          <div className='flex'>
            <ThemeToggle />
          </div>
        </div>
      </div>
      {/*<form onSubmit={handleSearch} className='flex pl-4 w-10 mr-0'>
        <input
          ref={searchInputRef}
          value={searchQuery}
          onChange={handleSearchQueryChange}
          placeholder='search'
          className='h-8 w-24 ps-2 rounded-xs text-sm font-display text-foreground outline-none placeholder:text-foreground/80 placeholder:tracking-wider placeholder:font-light focus:ring-1 focus:ring-foreground/20 mr-4'
        />
      </form>*/}
      {/*<Icon name='book-open' className='size-5 hidden md:flex flex-1 text-foreground/70' />*/}
    </div>
  )
}
