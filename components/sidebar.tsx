'use client'
import { preloadExploreData } from '@/lib/explore-data'
import { Icon, IconName } from '@/lib/icons'
import { preloadMarketsData } from '@/lib/markets-data'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { useOverviewPrefetch } from './overview-prefetch-provider'
import { ThemeToggle } from './theme-toggle'

const navItems: { icon: IconName; label: string; path: string }[] = [
  { icon: 'theme', label: 'Overview', path: '/' },
  { icon: 'cf-pen', label: 'Markets', path: '/markets' },
  { icon: 'arrow-right', label: 'Explore', path: '/explore' },
  { icon: 'information', label: 'Bets', path: '/bets' }
]

export const Sidebar = () => {
  const pathname = usePathname()
  const router = useRouter()
  const { isOverviewLoaded } = useOverviewPrefetch()
  const hasPrefetchedRef = useRef(false)

  useEffect(() => {
    if (pathname !== '/' || !isOverviewLoaded || hasPrefetchedRef.current) {
      return
    }

    navItems.forEach(({ path }) => {
      if (path !== pathname) {
        router.prefetch(path)

        if (path === '/explore') {
          preloadExploreData()
        }

        if (path === '/markets') {
          preloadMarketsData()
        }
      }
    })

    hasPrefetchedRef.current = true
  }, [isOverviewLoaded, pathname, router])

  return (
    <aside className='fixed left-0 top-0 bottom-0 w-16 lg:min-w-54 bg-background border-r-[0.5px] border-dotted border-border z-50 flex flex-col'>
      {/* Logo */}
      <div className='h-16 flex items-center justify-center border-b-[0.5px] border-dotted border-border'>
        <div className='flex items-center justify-start space-x-4 px-6 h-16 w-full'>
          <Icon name='re-up.ph' className='size-4' />
          <h2 className='font-display font-medium text-foreground text-base whitespace-nowrap leading-0 tracking-tight'>
            WebTech
          </h2>
        </div>
      </div>

      {/* Navigation */}
      <nav className='flex-1'>
        {navItems.map(({ label, path }) => {
          const isActive = pathname === path
          return (
            <Link
              key={path}
              href={path}
              prefetch='auto'
              className={cn(
                'relative flex items-center gap-3 px-6 h-16 group text-foreground/80 hover:text-foreground hover:bg-foreground/4',
                { 'text-primary bg-primary/6 hover:bg-primary/8': isActive }
              )}>
              {isActive && (
                <div className='absolute left-0 top-1/2 -translate-y-1/2 w-0.75 h-5 bg-primary rounded-r-full' />
              )}
              <h2 className='font-display font-medium text-foreground text-base whitespace-nowrap leading-0 tracking-tight'>
                {label}
              </h2>
            </Link>
          )
        })}
      </nav>

      {/* Status */}
      <div className='h-16 flex items-center lg:px-6 border-t-[0.5px] border-dotted border-border'>
        <div className='flex items-center justify-center lg:justify-end gap-2'>
          {/*<div className='w-2 h-2 rounded-full bg-positive' />*/}
          <ThemeToggle />
        </div>
      </div>
    </aside>
  )
}
