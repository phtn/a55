'use client'

import gsap from 'gsap'
import { useCallback, useEffect, useRef, useState } from 'react'

interface ScrambleTextProps {
  text: string
  className?: string
  /** Delay in milliseconds before animation starts */
  delayMs?: number
  /** Duration of the scramble animation in seconds */
  duration?: number
}

interface ScrambleTextOnHoverProps {
  text: string
  className?: string
  /** Duration of the scramble animation in seconds */
  duration?: number
  /** Element type to render */
  as?: 'span' | 'button' | 'div'
  /** onClick handler for buttons */
  onClick?: () => void
}

const GLYPHS = '!@#$%^&*()_+-=<>?/\\[]{}Xx'

function createScrambledText(text: string) {
  return text
    .split('')
    .map(() => GLYPHS[Math.floor(Math.random() * GLYPHS.length)])
    .join('')
}

/**
 * Run the scramble animation on text
 */
function runScrambleAnimation(
  text: string,
  duration: number,
  setDisplayText: (text: string) => void,
  onComplete?: () => void
): gsap.core.Tween {
  const lockedIndices = new Set<number>()
  const finalChars = text.split('')
  const totalChars = finalChars.length
  const scrambleObj = { progress: 0 }

  return gsap.to(scrambleObj, {
    progress: 1,
    duration,
    ease: 'power2.out',
    onUpdate: () => {
      const numLocked = Math.floor(scrambleObj.progress * totalChars)

      for (let i = 0; i < numLocked; i++) {
        lockedIndices.add(i)
      }

      const newDisplay = finalChars
        .map((char, i) => {
          if (lockedIndices.has(i)) return char
          return GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
        })
        .join('')

      setDisplayText(newDisplay)
    },
    onComplete: () => {
      setDisplayText(text)
      onComplete?.()
    }
  })
}

/**
 * Scramble text animation component - animates on mount.
 */
export function ScrambleText({ text, className, delayMs = 0, duration = 0.9 }: ScrambleTextProps) {
  // Initialize with text to avoid flash of empty content
  const [displayText, setDisplayText] = useState(text)
  const [hasAnimated, setHasAnimated] = useState(false)
  const containerRef = useRef<HTMLSpanElement>(null)
  const animationRef = useRef<gsap.core.Tween | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasStartedRef = useRef(false)

  // Run animation only once on initial mount
  useEffect(() => {
    if (hasStartedRef.current || !text) return
    hasStartedRef.current = true

    timeoutRef.current = setTimeout(() => {
      setDisplayText(createScrambledText(text))
      animationRef.current = runScrambleAnimation(text, duration, setDisplayText, () => {
        setHasAnimated(true)
      })
    }, delayMs)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (animationRef.current) animationRef.current.kill()
    }
  }, [delayMs, duration, text])

  return (
    <span ref={containerRef} className={className}>
      {hasAnimated ? text : displayText || text}
    </span>
  )
}

/**
 * Scramble text animation component - animates on hover.
 */
export function ScrambleTextOnHover({
  text,
  className,
  duration = 0.4,
  as: Component = 'span',
  onClick
}: ScrambleTextOnHoverProps) {
  const [displayText, setDisplayText] = useState(text)
  const [isAnimating, setIsAnimating] = useState(false)
  const tweenRef = useRef<gsap.core.Tween | null>(null)

  const handleMouseEnter = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)

    // Kill any existing animation
    if (tweenRef.current) {
      tweenRef.current.kill()
    }

    // Start with scrambled
    setDisplayText(createScrambledText(text))

    tweenRef.current = runScrambleAnimation(text, duration, setDisplayText, () => {
      setIsAnimating(false)
    })
  }, [isAnimating, text, duration])

  return (
    <Component className={className} onMouseEnter={handleMouseEnter} onClick={onClick}>
      {isAnimating ? displayText : text}
    </Component>
  )
}
