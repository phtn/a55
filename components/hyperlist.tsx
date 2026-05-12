import { ScrollArea } from '@/components/ui/scroll-area'
import { type ClassName } from '@/types'
import { AnimatePresence, motion, type Variants } from 'motion/react'
import { type FC, type ReactNode, useCallback, useMemo } from 'react'

interface HyperListProps<T> {
  keyId?: keyof T
  component: FC<T>
  data: T[] | undefined
  container?: ClassName
  itemStyle?: ClassName
  reversed?: boolean
  orderBy?: keyof T
  max?: number
  children?: ReactNode
  direction?: 'up' | 'down' | 'left' | 'right'
  delay?: number
  duration?: number
  disableAnimation?: boolean
  withExitAnimation?: boolean
}

export const HyperList = <T extends object>(props: HyperListProps<T>) => {
  const {
    component: Item,
    container = '',
    children,
    data,
    delay = 0,
    direction = 'down',
    itemStyle,
    keyId,
    max = 15,
    orderBy = 'updated_at',
    reversed = false,
    disableAnimation = false,
    withExitAnimation = false,
    duration = 0.5
  } = props

  const baseContainerStyle = useMemo(() => {
    // Don't add overflow-y-auto if container has grid classes (grid layouts shouldn't have forced overflow)
    const hasGrid = container.includes('grid')
    return hasGrid ? container : `${container} overflow-y-auto`
  }, [container])

  const baseItemStyle = useMemo(() => `${itemStyle} group/list`, [itemStyle])

  const variants: Variants = useMemo(
    () => ({
      down: {
        opacity: 0,
        y: -10
      },
      up: {
        opacity: 0,
        y: 10
      },
      left: {
        opacity: 0,
        x: 10
      },
      right: {
        opacity: 0,
        x: -10
      }
    }),
    []
  )

  const animate = useMemo(() => {
    switch (direction) {
      case 'up':
        return { y: 0 }
      case 'left':
        return { x: 0 }
      case 'right':
        return { x: 0 }
      default:
        return { y: 0 }
    }
  }, [direction])

  const slicedData = useMemo(
    () => (reversed ? data?.slice(0, max).reverse() : data?.slice(0, max)),
    [data, max, reversed]
  )

  const render = useCallback(
    (i: T, j: number) => {
      const key = keyId && keyId in i ? String(i[keyId]) : String(j)

      return (
        <motion.li
          key={key}
          initial={disableAnimation ? false : direction}
          variants={variants}
          animate={{ opacity: 1, ...animate }}
          exit={
            withExitAnimation
              ? (() => {
                  const slideOut =
                    direction === 'down'
                      ? { y: 40 }
                      : direction === 'up'
                        ? { y: -40 }
                        : direction === 'left'
                          ? { x: -20 }
                          : { x: 20 }
                  return {
                    opacity: 0,
                    transition: { duration: 0.2, ease: 'easeIn' },
                    ...slideOut
                  }
                })()
              : undefined
          }
          transition={{
            type: 'spring',
            visualDuration: duration,
            bounce: 0.5,
            delay: j * 0.05 + delay
          }}
          className={baseItemStyle}>
          <Item {...i} />
        </motion.li>
      )
    },
    [Item, delay, keyId, animate, variants, duration, direction, baseItemStyle, disableAnimation, withExitAnimation]
  )

  const sortFn = useCallback(
    (a: T, b: T) => {
      if (orderBy in b && orderBy in a) {
        return Number(b[orderBy as keyof T]) - Number(a[orderBy as keyof T])
      }
      return 0
    },
    [orderBy]
  )

  const sorted = useMemo(() => slicedData?.slice().sort(sortFn) ?? [], [slicedData, sortFn])

  return (
    <ScrollArea>
      {children}
      <ul className={baseContainerStyle}>
        <AnimatePresence mode='sync'>{sorted.map(render)}</AnimatePresence>
      </ul>
    </ScrollArea>
  )
}
