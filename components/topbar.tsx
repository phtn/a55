'use client'
import { useTheme } from '@/components/theme-provider'
import dynamic from 'next/dynamic'
import { usePathname, useRouter } from 'next/navigation'
import { SubmitEvent, useState } from 'react'

const PixelGrid = dynamic(() => import('three-px-react').then((mod) => mod.PixelGrid), {
  ssr: false
})

const PAGE_TITLES: Record<string, string> = {
  '/': 'Overview',
  '/explore': 'Explore Stocks',
  '/icons': 'Icons',
  '/markets': 'Global Markets',
  '/watchlist': 'Watchlist'
}

const formatSegment = (segment: string) =>
  segment
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

const getPageTitle = (pathname: string) => {
  if (PAGE_TITLES[pathname]) {
    return PAGE_TITLES[pathname]
  }

  const segments = pathname.split('/').filter(Boolean)

  if (segments[0] === 'company' && segments[1]) {
    return segments[1].toUpperCase()
  }

  return segments.length > 0 ? formatSegment(segments[segments.length - 1]) : PAGE_TITLES['/']
}

export const TopBar = () => {
  const [query, setQuery] = useState('')
  const navigate = useRouter()
  const pathname = usePathname()
  const { resolvedTheme } = useTheme()
  const pageTitle = getPageTitle(pathname ?? '')

  const handleSearch = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (query.trim()) {
      navigate.push(`/company/${query.trim().toUpperCase()}`)
      setQuery('')
    }
  }

  return (
    <header className='sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70'>
      <div className='flex min-h-16 items-center gap-4 px-4 sm:gap-6 sm:px-8'>
        <div className='flex min-w-0 flex-1 items-center gap-4 sm:gap-6'>
          <div className='min-w-0 flex-1'>
            <h1 className='truncate font-display text-2xl font-bold text-foreground sm:text-lg'>{pageTitle}</h1>
          </div>

          <form onSubmit={handleSearch} className='hidden w-full max-w-xs md:block lg:max-w-sm'>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Search'
              className='h-9 w-full rounded-xs px-4 text-sm font-display text-foreground outline-none placeholder:text-foreground/40 focus:ring-1 focus:ring-ring'
            />
          </form>
        </div>

        <div className='hidden shrink-0 sm:block'>
          <PixelGrid animation='snake' color={resolvedTheme === 'dark' ? '#f5f5f5' : '#CCC'} duration={1000} />
        </div>
      </div>
    </header>
  )
}
