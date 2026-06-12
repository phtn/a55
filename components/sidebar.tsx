'use client'

import { preloadExploreData } from '@/lib/explore-data'
import { useFirebaseUser } from '@/lib/firebase/auth'
import { getInitials } from '@/lib/helpers/user'
import { Icon, IconName } from '@/lib/icons'
import { preloadMarketsData } from '@/lib/markets-data'
import {
  adminSubdomainHandoffPath,
  supportsAdminSubdomain,
  toAdminSubdomainHostname
} from '@/lib/routing/admin-subdomain'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useOverviewPrefetch } from './overview-prefetch-provider'
import { SignOutButton } from './signout-button'
import { ThemeToggle } from './theme-toggle'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Button } from './ui/button'
import { Menu } from './ui/menu'

const navItems: { icon: IconName; label: string; path: string }[] = [
  { icon: 'theme', label: 'Portfolio', path: '/x' },
  { icon: 'cf-pen', label: 'Markets', path: '/x/markets' },
  { icon: 'information', label: 'Explore', path: '/x/explore' }
]

export const Sidebar = () => {
  const pathname = usePathname()
  const { hasAdminClaim, user } = useFirebaseUser()
  const router = useRouter()
  const { isOverviewLoaded } = useOverviewPrefetch()
  const hasPrefetchedRef = useRef(false)
  const [isNavigatingToAdmin, setIsNavigatingToAdmin] = useState(false)

  useEffect(() => {
    if (pathname !== '/x' || !isOverviewLoaded || hasPrefetchedRef.current) {
      return
    }

    navItems.forEach(({ path }) => {
      if (path !== pathname) {
        router.prefetch(path)

        if (path === '/x/markets') {
          preloadMarketsData()
        }

        if (path === '/x/explore') {
          preloadExploreData()
        }
      }
    })

    hasPrefetchedRef.current = true
  }, [isOverviewLoaded, pathname, router])

  const handleAdminNavigation = async () => {
    if (!user || isNavigatingToAdmin) {
      return
    }

    setIsNavigatingToAdmin(true)

    try {
      const currentUrl = new URL(window.location.href)
      const idToken = await user.getIdToken(true)

      // Determine target hostname for the handoff.
      // - When subdomain isolation is supported (custom domain with admin. DNS), go to admin.<host>
      // - Otherwise (Vercel previews, localhost in some cases, etc.) do same-origin handoff at /admin-handoff
      // This ensures we *always* go through /api/auth/admin-handoff which verifies the admin claim
      // and mints the session cookie with the correct domain attributes.
      const targetHostname = supportsAdminSubdomain(currentUrl.hostname)
        ? toAdminSubdomainHostname(currentUrl.hostname)
        : currentUrl.hostname

      const handoffUrl = new URL(currentUrl.origin)
      handoffUrl.hostname = targetHostname
      handoffUrl.pathname = adminSubdomainHandoffPath
      handoffUrl.search = ''
      handoffUrl.hash = new URLSearchParams({
        idToken,
        redirectTo: '/admin'
      }).toString()

      window.location.assign(handoffUrl.toString())
    } catch (error) {
      console.error('Failed to navigate to the admin app.', error)
      setIsNavigatingToAdmin(false)
    }
  }

  return (
    <aside className='fixed left-0 top-0 bottom-0 w-16 lg:min-w-54 bg-background border-r-[0.5px] border-dotted border-border z-50 flex flex-col'>
      {/* Logo */}
      <div className='h-16 flex items-center justify-center border-b-[0.5px] border-dotted border-border'>
        <div className='flex items-center space-x-2 ps-6 pe-1 h-16 w-full'>
          {/*<Icon name='369' className='size-6 opacity-90' />*/}
          <h1 className='font-poly font-bold italic text-foreground/80 text-base md:text-xl whitespace-nowrap tracking-wider leading-5'>
            <span className=''>A</span>
            <span className='opacity-70 font-semibold'>55</span>
          </h1>
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
                'relative flex items-center gap-3 px-6 h-16 group text-foreground/70 hover:text-foreground hover:bg-foreground/4',
                { 'text-foreground bg-primary/6 hover:bg-primary/8': isActive }
              )}>
              {isActive && (
                <div className='absolute left-0 top-1/2 -translate-y-1/2 w-0.75 h-5 bg-primary rounded-r-full' />
              )}
              <h2 className='font-display font-medium text-base whitespace-nowrap leading-0 tracking-tight'>{label}</h2>
            </Link>
          )
        })}
      </nav>

      {/* Status */}
      <div className='h-16 flex items-center lg:px-6 border-t-[0.5px] border-dotted border-border'>
        <div className='flex items-center justify-center lg:justify-end gap-4'>
          {/*<div className='w-2 h-2 rounded-full bg-positive' />*/}
          <Menu
            side='top'
            align='end'
            items={[{ id: 'sign-out', label: 'Sign Out', content: <SignOutButton /> }]}
            triggerClassName='h-auto rounded-full border-transparent bg-transparent p-0 text-inherit hover:bg-transparent active:bg-transparent data-popup-open:bg-transparent focus-visible:outline-1 focus-visible:outline-ring'>
            <Avatar size='sm'>
              <AvatarImage alt='pfp' src={user?.photoURL ?? undefined} className='grayscale' />
              <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
            </Avatar>
          </Menu>

          <ThemeToggle />
          {hasAdminClaim ? (
            <Button
              id='admin-navigator'
              variant='ghost'
              size='icon'
              className='size-5'
              disabled={isNavigatingToAdmin}
              onClick={() => {
                void handleAdminNavigation()
              }}>
              {isNavigatingToAdmin ? (
                <Icon name='spinner-ring' className='size-4 animate-spin' />
              ) : (
                <Icon name='imperial' className='size-5' onClick={undefined} />
              )}
            </Button>
          ) : null}
        </div>
      </div>
    </aside>
  )
}
