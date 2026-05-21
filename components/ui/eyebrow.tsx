import { ClassName } from '@/types'
import { ReactNode } from 'react'

interface EyebrowProps {
  children: ReactNode
  className?: ClassName
}

export const Eyebrow = ({ children, className }: EyebrowProps) => {
  return (
    <div
      className={`font-display text-foreground/60 text-[8px] tracking-[0.22em] uppercase whitespace-nowrap ${className}`}>
      {children}
    </div>
  )
}
