'use client'
import { preloadExploreData } from '@/lib/explore-data'
import { Icon, IconName } from '@/lib/icons'
import { preloadMarketsData } from '@/lib/markets-data'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useOverviewPrefetch } from './overview-prefetch-provider'

interface MenuItem {
  icon: IconName
  label: string
  path: string
  color: string
}

const navItems: MenuItem[] = [
  { icon: 'arrow-right', label: 'Overview', path: '/', color: 'hsl(187,90%,51%)' },
  { icon: 'arrow-right', label: 'Explore', path: '/explore', color: 'hsl(280,65%,60%)' },
  { icon: 'arrow-right', label: 'Watchlist', path: '/watchlist', color: 'hsl(38,92%,55%)' },
  { icon: 'arrow-right', label: 'Markets', path: '/markets', color: 'hsl(160,70%,45%)' },
  { icon: 'arrow-right', label: 'Bets', path: '/bets', color: '#ccc' }
]

const positions = [
  { x: 0, y: -80 },
  { x: 0, y: -160 },
  { x: 0, y: -240 },
  { x: 0, y: -320 }
]

export const Fab = () => {
  const [open, setOpen] = useState(false)
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
    <>
      <div
        aria-hidden='true'
        className={`fixed inset-0 z-40 bg-background/60 backdrop-blur-md transition-opacity duration-250 ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setOpen(false)}
      />

      {navItems.map((item, index) => {
        const isActive = pathname === item.path
        const pos = positions[index]
        const delay = open ? index * 45 : (navItems.length - 1 - index) * 30

        return (
          <div
            key={item.path}
            className={`fixed bottom-8 right-8 z-50 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
            }`}
            style={{
              transform: open
                ? `translate3d(${pos.x}px, ${pos.y}px, 0) scale(1)`
                : 'translate3d(0px, 0px, 0) scale(0.92)',
              transitionDelay: `${delay}ms`
            }}>
            <Link
              href={item.path}
              prefetch='auto'
              onClick={() => setOpen(false)}
              className='flex items-center gap-3 group'>
              <span
                className='rounded-lg px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider'
                style={{
                  color: isActive ? 'text-foreground' : 'text-slate-500',
                  backdropFilter: 'blur(8px)'
                }}>
                {item.label}
              </span>
              <div className='flex h-12 w-12 items-center justify-center rounded-2xl'>
                <Icon
                  name={item.icon}
                  className='size-4'
                  style={{ color: isActive ? 'text-foreground' : 'text-slate-500' }}
                />
              </div>
            </Link>
          </div>
        )
      })}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
        className='fixed bottom-8 right-8 z-60 flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-200 active:scale-95 bg-foreground/4 backdrop-blur-3xl'>
        <Icon
          name='menu'
          className={`size-5 transition-transform duration-250 ${open ? 'rotate-180 text-foreground' : 'text-foreground'}`}
        />
      </button>
    </>
  )
}
