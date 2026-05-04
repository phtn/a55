import { type ReactNode } from 'react'

export const Title = ({ children }: { children: ReactNode }) => {
  return <div className='mt-2 font-display text-foreground text-xl md:text-2xl tracking-tight'>{children}</div>
}
