import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface SectionHeaderProps {
  title: string
  tag: string
  id: string
  sm?: boolean
}

export const Header = forwardRef<HTMLDivElement, SectionHeaderProps>(function Header(
  { title, tag, id, sm = true },
  ref
) {
  return (
    <div ref={ref} className='mb-16 pr-6 pt-3 md:pr-12 border-t'>
      <span className='font-mono text-[8px] font-semibold uppercase tracking-[0.35em]'>
        <span className='font-extrabold text-foreground/50'>{id}</span>
        <span className='px-2 text-foreground/30'>/</span>
        <span className='text-foreground/60'>{tag}</span>
      </span>
      <h2
        className={cn('mt-4 font-display tracking-tight text-foreground', {
          'text-xl md:text-2xl': sm,
          'text-5xl md:text-6xl': !sm
        })}>
        {title}
      </h2>
    </div>
  )
})
