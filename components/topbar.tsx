'use client'
import { Icon } from '@/lib/icons'
import { LogoNameType } from '@/lib/icons/logos'
import { getPathnamePageTitle } from '@/lib/page-titles'
import { usePathname, useRouter } from 'next/navigation'
import { SubmitEvent, useEffect, useRef, useState } from 'react'
import { PixelGrid } from 'three-px-react'
import { usePageTitle } from './page-title-provider'
import { Typewrite } from './text/typewriter'
import { useTheme } from './theme-provider'
import { ThemeToggle } from './theme-toggle'

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

interface TopBarProps {
  companyWebsite?: string | null
}

export const TopBar = ({ companyWebsite: companyWebsiteProp = null }: TopBarProps) => {
  const [query, setQuery] = useState('')
  const navigate = useRouter()
  const pathname = usePathname()
  const { title, website } = usePageTitle()
  const { resolvedTheme } = useTheme()
  const pageTitle = title ?? getPathnamePageTitle(pathname ?? '')
  const companyWebsite = companyWebsiteProp ?? website
  const companyWebsiteHref = companyWebsite ? normalizeWebsiteUrl(companyWebsite) : null
  const companyWebsiteLabel = companyWebsite ? getWebsiteLabel(companyWebsite) : null

  const searchInputRef = useRef<HTMLInputElement | null>(null)

  const handleSearch = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (query.trim()) {
      navigate.push(`/company/${query.trim().toUpperCase()}`)
      setQuery('')
    }
  }

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
      <div className='flex items-center justify-between h-16 border-b-[0.5px] border-border border-dotted gap-0'>
        <div className='flex items-center justify-between gap-18'>
          <div className='h-6 flex items-center md:w-2xl 2xl:w-3xl ml-4 md:ml-8 md:gap-4'>
            <div className='flex items-center justify-center size-5 aspect-square'>
              {pathname ? (
                <Icon
                  name={pathname.split('/').pop()?.toLowerCase() as LogoNameType}
                  className='size-6 md:size-6 text-foreground/70 bg-linear-to-l from-background/80 via-background to-transparent'
                />
              ) : (
                <PixelGrid
                  animation='snake'
                  color={resolvedTheme === 'dark' ? '#f5f5f5' : '#CCC'}
                  className='md:scale-82 scale-85'
                  duration={1200}
                />
              )}
            </div>
            <Typewrite
              id='company-name'
              text={pageTitle}
              showCursor={false}
              speed={22}
              className='truncate font-display font-medium text-foreground/80 text-sm md:text-lg tracking-[0.02em] leading-4.25 text-balance max-w-[18ch] md:max-w-[32ch] line-clamp-2 md:line-clamp-none'
            />
          </div>

          <div className='flex items-center'>
            <div className='flex items-center w-3xs'>
              {companyWebsiteHref && companyWebsiteLabel && (
                <a
                  id='company-website-link'
                  href={companyWebsiteHref}
                  target='_blank'
                  rel='noreferrer'
                  className='flex items-center font-display font-thin text-sm text-foreground/80 hover:text-foreground hover:underline underline-offset-2 decoration-dotted decoration-foreground/50 tracking-wider'>
                  <span>{companyWebsiteLabel}</span>
                  <Icon name='arrow-right' className='size-3 -rotate-23' />
                </a>
              )}
            </div>
            <div className='h-6 w-44 flex items-center space-x-4'>
              <Icon name='two-way' className='size-5 hidden md:flex text-foreground/70' />
              <Icon name='folder' className='size-5 hidden md:flex text-foreground/70' />
              <div className='md:hidden flex'>
                <ThemeToggle />
              </div>
            </div>
            <form onSubmit={handleSearch} className='hidden md:flex pl-4 w-3xs mr-0'>
              <input
                ref={searchInputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='search'
                className='h-8 w-full ps-2 rounded-xs text-sm font-display text-foreground outline-none placeholder:text-foreground/80 placeholder:tracking-wider placeholder:font-light focus:ring-1 focus:ring-foreground/20 mr-4'
              />
            </form>
            <Icon name='book-open' className='size-5 hidden md:flex flex-1 text-foreground/70' />
          </div>
        </div>
      </div>
    </header>
  )
}
