import { type ReactNode } from 'react'

export const Title = ({ children }: { children: ReactNode }) => {
  return <div className='mt-2 font-display text-foreground text-xl md:text-xl tracking-tight'>{children}</div>
}
