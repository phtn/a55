'use client'
import Image from 'next/image'
import dynamic from 'next/dynamic'

const PixelGrid = dynamic(() => import('three-px-react').then((mod) => mod.PixelGrid), {
  ssr: false
})

interface ContentProps {
  category?: string
}

function formatCategory(category?: string) {
  if (!category) {
    return 'Overview'
  }

  return category
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export const Content = ({ category }: ContentProps) => {
  const title = formatCategory(category)

  return (
    <div className='flex flex-col items-start justify-center'>
      <main className='flex w-full max-w-3xl flex-1 flex-col items-center justify-between gap-14 bg-background sm:items-start'>
        <div className='flex flex-col gap-4 text-left'>
          <div className='flex items-center space-x-4'>
            <PixelGrid animation='checkerboard' color='#AAAAAA' duration={2000} className='animate-pulse' />
            <h1 className='max-w-xs font-display font-semibold text-foreground text-xl leading-0'>{title}</h1>
          </div>
          <p className='max-w-md text-base leading-6 font-display text-foreground/50'>
            Looking for a starting point for your next web app? Head over to{' '}
            <a href='https://github.com/phtn/bridge.git' className='text-foreground'>
              Github (Bridge) Template
            </a>{' '}
            and clone the repo as template.
          </p>
        </div>
        <div className='hidden _flex flex-col gap-4 text-base font-medium sm:flex-row'>
          <a
            className='flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-foreground/85 md:w-40'
            href='https://bigticket.ph'
            target='_blank'
            rel='noopener noreferrer'>
            <Image className='invert dark:invert-0' src='/vercel.svg' alt='Vercel logomark' width={16} height={16} />
            Projects
          </a>
          <a
            className='flex h-12 w-full items-center justify-center rounded-full border border-border px-5 text-foreground transition-colors hover:border-transparent hover:bg-foreground/5 md:w-40'
            href='https://launch-day-pied.vercel.app/'
            target='_blank'
            rel='noopener noreferrer'>
            re-up.ph
          </a>
        </div>
      </main>
    </div>
  )
}
