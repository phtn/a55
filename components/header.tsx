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
    <div ref={ref} className='mb-16 pr-6 md:pr-12'>
      <span className='font-mono text-[10px] font-semibold uppercase tracking-[0.35em] text-muted-foreground'>
        <span className='font-extrabold text-foreground/70'>{id}</span>
        <span className='px-2 text-foreground/30'>/</span>
        {tag}
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
