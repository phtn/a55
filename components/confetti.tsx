'use client'

import { cn } from '@/lib/utils'
import confetti, { type CreateTypes, type GlobalOptions, type Options } from 'canvas-confetti'
import { useCallback, useEffect, useRef } from 'react'

interface ConfettiProps extends React.ComponentProps<'canvas'> {
  options?: Options
  globalOptions?: GlobalOptions
  manualstart?: boolean
}

export const Confetti = ({
  options,
  globalOptions = { resize: true, useWorker: true },
  manualstart = false,
  className,
  ...props
}: ConfettiProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const confettiRef = useRef<CreateTypes | null>(null)

  const setCanvasRef = useCallback(
    (node: HTMLCanvasElement | null) => {
      canvasRef.current = node
      if (!node) {
        confettiRef.current = null
        return
      }
      confettiRef.current = confetti.create(node, globalOptions)
    },
    [globalOptions]
  )

  const fire = useCallback(() => {
    if (!confettiRef.current) return
    confettiRef.current({
      particleCount: 180,
      colors: ['#333333', '#000000', '#CCCCCC', '#EEEEEE'],
      angle: 90,
      spread: 360,
      startVelocity: 48,
      ticks: 360,
      origin: { x: 0.5, y: 0.69 },
      ...options
    })
  }, [options])

  useEffect(() => {
    if (!manualstart) {
      fire()
    }
  }, [manualstart, fire])

  return <canvas ref={setCanvasRef} className={cn('pointer-events-none size-full', className)} {...props} />
}
