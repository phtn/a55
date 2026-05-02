'use client'
import { Icon, IconName } from '@/lib/icons'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, ViewTransition } from 'react'

interface MenuItem {
  icon: IconName
  label: string
  path: string
  color: string
}

const navItems: MenuItem[] = [
  { icon: 're-up.ph', label: 'Overview', path: '/', color: 'hsl(187,90%,51%)' },
  { icon: 'arrow-right', label: 'Explore', path: '/explore', color: 'hsl(280,65%,60%)' },
  { icon: 'cf-pen', label: 'Watchlist', path: '/watchlist', color: 'hsl(38,92%,55%)' },
  { icon: 'information', label: 'Markets', path: '/markets', color: 'hsl(160,70%,45%)' }
]

// Clean upward column — stacked above the FAB, never off-screen
const positions = [
  { x: 0, y: -80 },
  { x: 0, y: -160 },
  { x: 0, y: -240 },
  { x: 0, y: -320 }
]

export const Fab = () => {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Backdrop */}
      <ViewTransition>
        {open && (
          <div
            // initial={{ opacity: 0 }}
            // animate={{ opacity: 1 }}
            // exit={{ opacity: 0 }}
            className='fixed inset-0 z-40 bg-background/60 backdrop-blur-md'
            onClick={() => setOpen(false)}
          />
        )}
      </ViewTransition>

      {/* Orbital nav items */}
      <ViewTransition>
        {open &&
          navItems.map((item, i) => {
            const isActive = pathname === item.path
            const pos = positions[i]
            return (
              <div
                key={item.path}
                className='fixed bottom-8 right-8 z-50'
                style={{ x: pos.x, y: pos.y }}
                // initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                // animate={{ x: pos.x, y: pos.y, scale: 1, opacity: 1 }}
                // exit={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                // transition={{ type: 'spring', stiffness: 380, damping: 26, delay: i * 0.05 }}
              >
                <Link href={item.path} onClick={() => setOpen(false)} className='flex items-center gap-3 group'>
                  {/* Label to the left */}
                  <span
                    className='text-[11px] font-mono tracking-wider uppercase px-2.5 py-1 rounded-lg'
                    style={{
                      color: isActive ? item.color : 'hsl(215,14%,65%)',
                      background: isActive ? `${item.color}18` : 'hsla(220,18%,10%,0.7)',
                      backdropFilter: 'blur(8px)'
                    }}>
                    {item.label}
                  </span>
                  {/* Icon button */}
                  <div
                    // whileTap={{ scale: 0.88 }}
                    className='w-12 h-12 rounded-2xl flex items-center justify-center'
                    style={{
                      background: isActive ? item.color : 'hsla(220,18%,10%,0.95)',
                      boxShadow: `0 0 0 1px ${item.color}35, 0 4px 16px ${item.color}20`,
                      backdropFilter: 'blur(16px)'
                    }}>
                    <Icon
                      name={item.icon}
                      className='size-4'
                      style={{ color: isActive ? 'hsl(220,20%,4%)' : item.color }}
                    />
                  </div>
                </Link>
              </div>
            )
          })}
      </ViewTransition>

      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className='fixed bottom-8 right-8 z-50 w-14 h-14 rounded-2xl flex items-center justify-center'
        style={{
          background: open
            ? 'hsla(220,18%,10%,0.98)'
            : 'linear-gradient(135deg, hsl(187,90%,51%) 0%, hsl(220,90%,60%) 100%)',
          boxShadow: open
            ? '0 0 0 1px hsla(210,20%,92%,0.08), 0 8px 32px hsla(220,20%,4%,0.6)'
            : '0 0 0 1px hsla(187,90%,51%,0.3), 0 8px 32px hsla(187,90%,51%,0.25)'
        }}
        // whileTap={{ scale: 0.9 }}
        // whileHover={{ scale: 1.05 }}
      >
        <ViewTransition>
          {open ? (
            <div
              key='x'
              // initial={{ rotate: -90, opacity: 0 }}
              // animate={{ rotate: 0, opacity: 1 }}
              // exit={{ rotate: 90, opacity: 0 }}
              // transition={{ duration: 0.2 }}
            >
              <span className='w-5 h-5 text-foreground' />
            </div>
          ) : (
            <div
              key='menu'
              // initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}
            >
              <Icon name='re-up.ph' className='w-5 h-5' />
            </div>
          )}
        </ViewTransition>
      </button>
    </>
  )
}
