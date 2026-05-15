import { cn } from '@/lib/utils'
import { Menu as M } from '@base-ui/react/menu'
import { ReactNode } from 'react'

interface MenuItem {
  id: string
  label: string
  content: ReactNode
  value?: string
}
interface MenuProps {
  items: MenuItem[]
  children?: ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right' | 'inline-end' | 'inline-start'
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
  triggerClassName?: string
  popupClassName?: string
}
export const Menu = ({
  children,
  items,
  side = 'bottom',
  align = 'center',
  sideOffset = 8,
  triggerClassName,
  popupClassName
}: MenuProps) => {
  return (
    <M.Root>
      <M.Trigger
        className={cn(
          'flex items-center justify-center gap-1.5 rounded-md border border-border text-base font-normal text-foreground select-none active:bg-background data-popup-open:bg-background',
          triggerClassName
        )}>
        {children ?? 'Menu'}
      </M.Trigger>
      <M.Portal>
        <M.Positioner
          positionMethod='fixed'
          side={side}
          align={align}
          sideOffset={sideOffset}
          className='z-60 outline-hidden'>
          <M.Popup
            className={cn(
              'z-60 origin-(--transform-origin) rounded-md py-0 bg-background/10 backdrop-blur-3xl shadow-lg shadow-gray-200 border border-foreground/20 transition-[transform,scale,opacity] data-ending-style:scale-90 data-ending-style:opacity-0 data-starting-style:scale-90 data-starting-style:opacity-0 dark:shadow-none',
              popupClassName
            )}>
            {items.map((item) => (
              <M.Item key={item.id} label={item.label}>
                {item.content}
              </M.Item>
            ))}
          </M.Popup>
        </M.Positioner>
      </M.Portal>
    </M.Root>
  )
}
