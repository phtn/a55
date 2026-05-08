'use client'

import gsap from 'gsap'
import type { ElementType, HTMLAttributes, ReactNode } from 'react'
import { createElement, useEffect, useMemo, useRef } from 'react'

import { cn } from '@/lib/utils'

interface CursorAnimationConfig {
  initial?: GSAPTweenVars
  animate?: GSAPTweenVars
}

interface TypewriterProps {
  /**
   * Text or array of texts to type out
   */
  text: string | string[]

  /**
   * Speed of typing in milliseconds
   * @default 50
   */
  speed?: number

  /**
   * Initial delay before typing starts
   * @default 0
   */
  initialDelay?: number

  /**
   * Time to wait between typing and deleting
   * @default 2000
   */
  waitTime?: number

  /**
   * Speed of deleting characters
   * @default 30
   */
  deleteSpeed?: number

  /**
   * Whether to loop through texts array
   * @default true
   */
  loop?: boolean

  /**
   * Optional class name for styling
   */
  className?: string

  /**
   * Whether to show the cursor
   * @default true
   */
  showCursor?: boolean

  /**
   * Hide cursor while typing
   * @default false
   */
  hideCursorOnType?: boolean

  /**
   * Character or React node to use as cursor
   * @default "_"
   */
  cursorChar?: string | ReactNode

  /**
   * GSAP animation config for cursor
   */
  cursorAnimationVariants?: CursorAnimationConfig

  /**
   * Optional class name for cursor styling
   */
  cursorClassName?: string

  /**
   * HTML Tag or React component to render as
   * @default "div"
   */
  as?: ElementType
}

const DEFAULT_CURSOR_ANIMATION: Required<CursorAnimationConfig> = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    duration: 0.01,
    repeat: -1,
    repeatDelay: 0.4,
    yoyo: true,
    ease: 'none'
  }
}

export const Typewrite = ({
  text,
  as,
  speed = 50,
  initialDelay = 0,
  waitTime = 2000,
  deleteSpeed = 30,
  loop = true,
  className,
  showCursor = true,
  hideCursorOnType = false,
  cursorChar = '_',
  cursorClassName = 'ml-1',
  cursorAnimationVariants = DEFAULT_CURSOR_ANIMATION,
  ...props
}: TypewriterProps & HTMLAttributes<HTMLElement>) => {
  const textRef = useRef<HTMLSpanElement>(null)
  const cursorRef = useRef<HTMLSpanElement>(null)

  const texts = useMemo(() => {
    const values = Array.isArray(text) ? text : [text]
    return values.length > 0 ? values : ['']
  }, [text])
  const Tag: ElementType = as ?? 'div'

  useEffect(() => {
    const textNode = textRef.current
    if (!textNode) {
      return
    }

    const cursorNode = cursorRef.current
    const proxy = { value: 0 }
    const shouldCycleTexts = texts.length > 1

    const setDisplayText = (value: string) => {
      textNode.textContent = value
    }

    const setCursorTypingState = (isTyping: boolean, blinkTween?: GSAPTween) => {
      if (!cursorNode || !hideCursorOnType) {
        return
      }

      if (isTyping) {
        blinkTween?.pause(0)
        gsap.set(cursorNode, { autoAlpha: 0 })
        return
      }

      gsap.set(cursorNode, { autoAlpha: 1 })
      blinkTween?.restart()
    }

    const blinkTween =
      cursorNode && showCursor
        ? gsap.fromTo(
            cursorNode,
            { ...DEFAULT_CURSOR_ANIMATION.initial, ...cursorAnimationVariants.initial },
            { ...DEFAULT_CURSOR_ANIMATION.animate, ...cursorAnimationVariants.animate }
          )
        : undefined

    setDisplayText('')
    setCursorTypingState(texts[0].length > 0, blinkTween)

    const timeline = gsap.timeline({
      delay: initialDelay / 1000,
      repeat: loop && shouldCycleTexts ? -1 : 0
    })

    texts.forEach((currentText) => {
      timeline.call(() => {
        proxy.value = 0
        setDisplayText('')
        setCursorTypingState(currentText.length > 0, blinkTween)
      })

      if (currentText.length > 0) {
        timeline.to(proxy, {
          value: currentText.length,
          duration: (currentText.length * speed) / 1000,
          ease: 'none',
          snap: { value: 1 },
          onUpdate: () => {
            setDisplayText(currentText.slice(0, Math.round(proxy.value)))
          },
          onComplete: () => {
            setDisplayText(currentText)
          }
        })
      }

      timeline.call(() => {
        setCursorTypingState(false, blinkTween)
      })

      if (!shouldCycleTexts) {
        return
      }

      if (waitTime > 0) {
        timeline.to({}, { duration: waitTime / 1000 })
      }

      timeline.call(() => {
        setCursorTypingState(currentText.length > 0, blinkTween)
      })

      if (currentText.length > 0) {
        timeline.to(proxy, {
          value: 0,
          duration: (currentText.length * deleteSpeed) / 1000,
          ease: 'none',
          snap: { value: 1 },
          onUpdate: () => {
            setDisplayText(currentText.slice(0, Math.round(proxy.value)))
          },
          onComplete: () => {
            setDisplayText('')
          }
        })
      } else {
        timeline.call(() => {
          setDisplayText('')
        })
      }
    })

    if (hideCursorOnType && shouldCycleTexts && !loop) {
      timeline.call(() => {
        setCursorTypingState(false, blinkTween)
      })
    }

    return () => {
      timeline.kill()
      blinkTween?.kill()
    }
  }, [cursorAnimationVariants, deleteSpeed, hideCursorOnType, initialDelay, loop, showCursor, speed, texts, waitTime])

  return createElement(
    Tag,
    {
      className: cn('inline whitespace-pre-wrap', className),
      ...props
    },
    <>
      <span ref={textRef} />
      {showCursor && (
        <span ref={cursorRef} className={cn(cursorClassName)}>
          {cursorChar}
        </span>
      )}
    </>
  )
}
