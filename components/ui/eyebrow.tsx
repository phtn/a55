import { ReactNode } from 'react'

export const Eyebrow = ({ children }: { children: ReactNode }) => {
  return <div className='font-display text-foreground/60 text-[8px] tracking-[0.22em] uppercase'>{children}</div>
}
