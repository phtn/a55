'use client'
import { Icon, IconName } from '@/lib/icons'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from './theme-toggle'

const navItems: { icon: IconName; label: string; path: string }[] = [
  { icon: 'theme', label: 'Funding', path: '/' },
  { icon: 'arrow-right', label: 'Transfer', path: '/explore' },
  { icon: 'information', label: 'Icons', path: '/icons' },
  { icon: 'cf-pen', label: 'Bets', path: '/markets' }
]

export const Sidebar = () => {
  const pathname = usePathname()

  return (
    <aside className='fixed left-0 top-0 bottom-0 w-16 lg:min-w-54 bg-background border-r-[0.5px] border-dotted border-border z-50 flex flex-col'>
      {/* Logo */}
      <div className='h-16 flex items-center justify-center border-b-[0.5px] border-dotted border-border'>
        <div className='flex items-center justify-start space-x-4 px-6 h-16 w-full'>
          <Icon name='re-up.ph' className='size-3.5' />
          <h2 className='font-display font-medium text-foreground text-base whitespace-nowrap leading-0 tracking-tight'>
            Web Technologies
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
              className={`relative flex items-center gap-3 px-6 h-10 group
                ${
                  isActive
                    ? 'text-primary bg-primary/6 hover:bg-primary/8'
                    : 'text-foreground/80 hover:text-foreground hover:bg-foreground/4'
                }`}>
              {isActive && (
                <div
                  className='absolute left-0 top-1/2 -translate-y-1/2 w-0.75 h-5 bg-primary rounded-r-full'
                  // transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className='hidden lg:block font-display font-medium text-sm'>{label}</span>
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
