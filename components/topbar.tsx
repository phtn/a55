'use client'
import { useTheme } from '@/components/theme-provider'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { SubmitEvent, useState, ViewTransition } from 'react'

const PixelGrid = dynamic(() => import('three-px-react').then((mod) => mod.PixelGrid), {
  ssr: false
})

export const TopBar = () => {
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useRouter()
  const { resolvedTheme } = useTheme()

  const handleSearch = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (query.trim()) {
      navigate.push(`/company/${query.trim().toUpperCase()}`)
      setQuery('')
      setSearchOpen(false)
    }
  }

  return (
    <header className='sticky top-0 z-40 flex h-16 items-center gap-4 border-b-[0.5px] border-dotted border-border px-4 sm:gap-8 sm:px-8'>
      <div className='flex min-w-0 flex-1 items-center justify-between gap-4'>
        <h2 className='font-display text-sm tracking-wider'>Template-05-2026</h2>
        <h3 className='font-display hidden text-sm text-foreground md:block'>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </h3>
      </div>

      <div className='flex items-center gap-3 sm:gap-4'>
        <ViewTransition>
          {searchOpen && (
            <form
              // initial={{ width: 0, opacity: 0 }}
              // animate={{ width: 280, opacity: 1 }}
              // exit={{ width: 0, opacity: 0 }}
              // transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              onSubmit={handleSearch}
              className='overflow-hidden'>
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='Search symbol (e.g. AAPL)...'
                className='h-9 rounded-full border border-border/60 bg-muted/60 px-4 text-sm font-mono text-foreground outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-ring'
                onBlur={() => {
                  if (!query) setSearchOpen(false)
                }}
              />
            </form>
          )}
        </ViewTransition>

        <div className='hidden sm:block'>
          <PixelGrid animation='snake' color={resolvedTheme === 'dark' ? '#f5f5f5' : '#CCC'} duration={1000} />
        </div>
      </div>
    </header>
  )
}
