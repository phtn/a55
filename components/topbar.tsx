'use client'
import { Icon } from '@/lib/icons'
import { getPathnamePageTitle } from '@/lib/page-titles'
import { usePathname, useRouter } from 'next/navigation'
import { SubmitEvent, useState } from 'react'
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

  const handleSearch = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (query.trim()) {
      navigate.push(`/company/${query.trim().toUpperCase()}`)
      setQuery('')
    }
  }

  return (
    <header className='sticky top-0 z-50 bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70'>
      <div className='flex items-center justify-between h-16 border-b-[0.5px] border-border border-dotted gap-4 px-4 md:px-4 sm:gap-6 sm:px-8'>
        <div className='flex w-full items-center justify-between'>
          <div className='min-w-0 h-6 flex-4 flex items-center space-x-1 md:space-x-1.5'>
            <div className='flex items-center justify-center size-5 aspect-square bg-radial from-background'>
              {title ? (
                <Icon name='aapl' className='size-4.5 text-foreground/70' />
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
              className='truncate font-display text-[1rem] font-semibold text-foreground/70 tracking-[0.02em]'></Typewrite>
          </div>

          <div className='min-w-1/10 flex items-center px-2'>
            {companyWebsiteHref && companyWebsiteLabel && (
              <a
                id='company-website-link'
                href={companyWebsiteHref}
                target='_blank'
                rel='noreferrer'
                className='flex items-center font-display font-thin text-sm text-foreground/80 hover:text-foreground hover:underline underline-offset-2 decoration-dotted decoration-foreground/50 tracking-wider'>
                <span>{companyWebsiteLabel}</span>
                <Icon name='arrow-right' className='size-3 -mb-0.75 -rotate-23' />
              </a>
            )}
          </div>
          <div className='h-6 w-6 md:w-36 flex items-center justify-center space-x-4'>
            <Icon name='two-way' className='size-5 hidden text-foreground/70' />
            <Icon name='folder' className='size-5 hidden text-foreground/70' />
            <Icon name='book-open' className='size-5 hidden text-foreground/70' />
            <div className='md:hidden flex'>
              <ThemeToggle />
            </div>
          </div>
          <form onSubmit={handleSearch} className='hidden w-full md:flex flex-1 pl-4'>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='search'
              className='h-8 w-full rounded-xs px-4 text-sm font-display text-foreground outline-none placeholder:text-foreground/60 placeholder:tracking-widest placeholder:font-thin focus:ring-1 focus:ring-ring'
            />
          </form>
        </div>
      </div>
    </header>
  )
}
