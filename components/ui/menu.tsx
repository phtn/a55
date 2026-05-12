import { Menu as M } from '@base-ui/react/menu'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

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
          'flex h-10 items-center justify-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-normal text-gray-900 select-none hover:bg-gray-100 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100 data-popup-open:bg-gray-100',
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
          className='z-[60] outline-hidden'>
          <M.Popup
            className={cn(
              'z-[60] origin-(--transform-origin) rounded-md bg-[canvas] py-1 text-gray-900 shadow-lg shadow-gray-200 outline-1 outline-gray-200 transition-[transform,scale,opacity] data-ending-style:scale-90 data-ending-style:opacity-0 data-starting-style:scale-90 data-starting-style:opacity-0 dark:shadow-none dark:-outline-offset-1 dark:outline-gray-300',
              popupClassName
            )}>
            <M.Arrow className='data-[side=bottom]:-top-2 data-[side=left]:-right-3.25 data-[side=left]:rotate-90 data-[side=right]:-left-3.25 data-[side=right]:-rotate-90 data-[side=top]:-bottom-2 data-[side=top]:rotate-180'>
              <ArrowSvg />
            </M.Arrow>
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

function ArrowSvg(props: React.ComponentProps<'svg'>) {
  return (
    <svg width='20' height='10' viewBox='0 0 20 10' fill='none' {...props}>
      <path
        d='M9.66437 2.60207L4.80758 6.97318C4.07308 7.63423 3.11989 8 2.13172 8H0V10H20V8H18.5349C17.5468 8 16.5936 7.63423 15.8591 6.97318L11.0023 2.60207C10.622 2.2598 10.0447 2.25979 9.66437 2.60207Z'
        className='fill-[canvas]'
      />
      <path
        d='M8.99542 1.85876C9.75604 1.17425 10.9106 1.17422 11.6713 1.85878L16.5281 6.22989C17.0789 6.72568 17.7938 7.00001 18.5349 7.00001L15.89 7L11.0023 2.60207C10.622 2.2598 10.0447 2.2598 9.66436 2.60207L4.77734 7L2.13171 7.00001C2.87284 7.00001 3.58774 6.72568 4.13861 6.22989L8.99542 1.85876Z'
        className='fill-gray-200 dark:fill-none'
      />
      <path
        d='M10.3333 3.34539L5.47654 7.71648C4.55842 8.54279 3.36693 9 2.13172 9H0V8H2.13172C3.11989 8 4.07308 7.63423 4.80758 6.97318L9.66437 2.60207C10.0447 2.25979 10.622 2.2598 11.0023 2.60207L15.8591 6.97318C16.5936 7.63423 17.5468 8 18.5349 8H20V9H18.5349C17.2998 9 16.1083 8.54278 15.1901 7.71648L10.3333 3.34539Z'
        className='dark:fill-gray-300'
      />
    </svg>
  )
}

function ChevronDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width='10' height='10' viewBox='0 0 10 10' fill='none' {...props}>
      <path d='M1 3.5L5 7.5L9 3.5' stroke='currentColor' strokeWidth='1.5' />
    </svg>
  )
}
