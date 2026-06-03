'use client'

import { useFirebaseUser } from '@/lib/firebase/auth'
import { getInitials } from '@/lib/helpers/user'
import { Icon, IconName } from '@/lib/icons'
import { stripAdminSubdomain, supportsAdminSubdomain } from '@/lib/routing/admin-subdomain'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useOverviewPrefetch } from '../overview-prefetch-provider'
import { SignOutButton } from '../signout-button'
import { ThemeToggle } from '../theme-toggle'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Button } from '../ui/button'
import { Menu } from '../ui/menu'

const navItems: { icon: IconName; label: string; path: string }[] = [
  { icon: 'theme', label: 'Overview', path: '/' },
  { icon: 'theme', label: 'Configs', path: '/configs' },
  { icon: 'cf-pen', label: 'Users', path: '/users' },
  { icon: 'information', label: 'Stakes', path: '/stakes' },
  { icon: 're-up.ph', label: 'Analytics', path: '/analytics' },
  { icon: 'refresh', label: 'Roulette', path: '/roulette' }
]

export const AdminSidebar = () => {
  const pathname = usePathname()
  const { hasAdminClaim, user } = useFirebaseUser()
  const router = useRouter()
  const { isOverviewLoaded } = useOverviewPrefetch()
  const hasPrefetchedRef = useRef(false)
  const [isExitingAdmin, setIsExitingAdmin] = useState(false)

  useEffect(() => {
    if (pathname !== '/' || !isOverviewLoaded || hasPrefetchedRef.current) {
      return
    }

    navItems.forEach(({ path }) => {
      if (path !== pathname) {
        router.prefetch(path)
      }
    })

    hasPrefetchedRef.current = true
  }, [isOverviewLoaded, pathname, router])

  const handleAdminExit = async () => {
    if (isExitingAdmin) {
      return
    }

    setIsExitingAdmin(true)

    try {
      const currentUrl = new URL(window.location.href)

      // When leaving admin, always land back on the main origin.
      // - Subdomain mode: strip "admin." so we return to the primary domain
      // - Same-origin mode (Vercel, forced off, etc.): stay on current hostname
      const targetHostname = supportsAdminSubdomain(currentUrl.hostname)
        ? stripAdminSubdomain(currentUrl.hostname)
        : currentUrl.hostname

      currentUrl.hostname = targetHostname
      currentUrl.pathname = '/x'
      currentUrl.search = ''
      currentUrl.hash = ''

      window.location.assign(currentUrl.toString())
    } catch (error) {
      console.error('Failed to exit the admin app.', error)
      setIsExitingAdmin(false)
    }
  }

  return (
    <aside className='fixed left-0 top-0 bottom-0 w-16 lg:min-w-54 bg-background border-r-[0.5px] border-dotted border-border z-50 flex flex-col'>
      {/* Logo */}
      <div className='h-16 flex items-center justify-center border-b-[0.5px] border-dotted border-border'>
        <div className='flex items-center space-x-4 ps-6 pe-1 h-16 w-full'>
          <Icon name='bet69' className='size-6 opacity-90' />
          <h2 className='font-poly font-bold italic text-foreground/80 text-base whitespace-nowrap leading-0 tracking-tight'>
            Stake Street
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
        <div className='flex items-center justify-center lg:justify-end gap-2'>
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
              id='admin-exit'
              variant='ghost'
              size='icon'
              className='size-5'
              disabled={isExitingAdmin}
              onClick={() => {
                void handleAdminExit()
              }}>
              {isExitingAdmin ? (
                <Icon name='spinner-ring' className='size-4 animate-spin' />
              ) : (
                <Icon name='crown-coin' className='size-5' />
              )}
            </Button>
          ) : null}
        </div>
      </div>
    </aside>
  )
}
