'use client'

import { BetResult } from '@/types/bets'
import { CSSProperties, useEffect, useRef, useState } from 'react'
import { NumberLegend } from './components'
import { RouletteNumberGrid } from './grid'

interface BoardProps {
  result: BetResult | null
}

const MOBILE_BOARD_GAP = 16

export const Board = ({ result }: BoardProps) => {
  const boardRef = useRef<HTMLDivElement>(null)
  const [boardScale, setBoardScale] = useState(1)

  useEffect(() => {
    if (!result) {
      return
    }

    const updateScale = () => {
      const element = boardRef.current

      if (!element) {
        return
      }

      const boardWidth = element.offsetWidth
      const boardHeight = element.offsetHeight

      if (!boardWidth || !boardHeight) {
        return
      }

      const viewportWidth = window.visualViewport?.width ?? window.innerWidth
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight
      const nextScale = Math.min(
        (viewportWidth - MOBILE_BOARD_GAP * 2) / boardHeight,
        (viewportHeight - MOBILE_BOARD_GAP * 2) / boardWidth
      )

      if (Number.isFinite(nextScale) && nextScale > 0) {
        setBoardScale(nextScale)
      }
    }

    updateScale()

    const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateScale)

    if (resizeObserver && boardRef.current) {
      resizeObserver.observe(boardRef.current)
    }

    window.addEventListener('resize', updateScale)
    window.visualViewport?.addEventListener('resize', updateScale)

    return () => {
      resizeObserver?.disconnect()
      window.removeEventListener('resize', updateScale)
      window.visualViewport?.removeEventListener('resize', updateScale)
    }
  }, [result])

  if (!result) {
    return <div className='text-sm text-foreground/50'>No bet result data available.</div>
  }
  return (
    <div className='max-sm:relative max-sm:h-dvh max-sm:overflow-hidden'>
      <div
        ref={boardRef}
        className='max-sm:absolute max-sm:left-1/2 max-sm:top-1/2 max-sm:origin-center max-sm:-translate-x-1/2 max-sm:-translate-y-1/2 max-sm:rotate-90 max-sm:scale-[var(--board-scale)]'
        style={{ '--board-scale': boardScale } as CSSProperties}>
        <RouletteNumberGrid result={result} />

        <NumberLegend />
      </div>
    </div>
  )
}
