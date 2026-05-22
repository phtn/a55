'use client'

import { Icon, type IconName } from '@/lib/icons'
import { motion } from 'motion/react'
import { createContext, useCallback, useContext, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import { useTheme } from './theme-provider'

interface AudioContextType {
  isMuted: boolean
  toggleMute: () => void
  playClick: () => void
}

type SplitFlapAudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext
  }

const SplitFlapAudioContext = createContext<AudioContextType | null>(null)

function useSplitFlapAudio() {
  return useContext(SplitFlapAudioContext)
}

export function SplitFlapAudioProvider({ children }: { children: React.ReactNode }) {
  const [isMuted, setIsMuted] = useState(true)
  const audioContextRef = useRef<AudioContext | null>(null)

  const getAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return null
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as SplitFlapAudioWindow).webkitAudioContext
      if (AudioContextClass) {
        audioContextRef.current = new AudioContextClass()
      }
    }
    return audioContextRef.current
  }, [])

  const triggerHaptic = useCallback(() => {
    if (isMuted) return
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }
  }, [isMuted])

  const playClick = useCallback(() => {
    if (isMuted) return

    triggerHaptic()

    try {
      const ctx = getAudioContext()
      if (!ctx) return

      if (ctx.state === 'suspended') {
        ctx.resume()
      }

      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      const filter = ctx.createBiquadFilter()
      const lowpass = ctx.createBiquadFilter()

      oscillator.type = 'square'
      oscillator.frequency.setValueAtTime(800 + Math.random() * 400, ctx.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.015)

      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(1200, ctx.currentTime)
      filter.Q.setValueAtTime(0.8, ctx.currentTime)

      lowpass.type = 'lowpass'
      lowpass.frequency.value = 2500
      lowpass.Q.value = 0.5

      gainNode.gain.setValueAtTime(0.05, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02)

      oscillator.connect(filter)
      filter.connect(gainNode)
      gainNode.connect(lowpass)
      lowpass.connect(ctx.destination)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.02)
    } catch {
      // Audio not supported
    }
  }, [isMuted, getAudioContext, triggerHaptic])

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev)
    if (isMuted) {
      try {
        const ctx = getAudioContext()
        if (ctx && ctx.state === 'suspended') {
          ctx.resume()
        }
      } catch {
        // Audio not supported
      }
    }
  }, [isMuted, getAudioContext])

  const value = useMemo(() => ({ isMuted, toggleMute, playClick }), [isMuted, toggleMute, playClick])

  return <SplitFlapAudioContext.Provider value={value}>{children}</SplitFlapAudioContext.Provider>
}

export function SplitFlapMuteToggle({ className = '' }: { className?: string }) {
  const audio = useSplitFlapAudio()
  if (!audio) return null

  return (
    <button
      onClick={audio.toggleMute}
      className={`inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors duration-200 ${className}`}
      aria-label={audio.isMuted ? 'Unmute sound effects' : 'Mute sound effects'}>
      {audio.isMuted ? <Icon name='re-up.ph' className='w-4 h-4' /> : <Icon name='re-up.ph' className='w-4 h-4' />}
      <span>{audio.isMuted ? 'Off' : 'On'}</span>
    </button>
  )
}

interface SplitFlapTextProps {
  text: string
  className?: string
  speed?: number
  size?: string
  gap?: string
  iconName?: IconName
}

const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('')
const CHARSET_SET = new Set(CHARSET)
const DEFAULT_SPLIT_FLAP_SIZE = 'clamp(2rem, 10vw, 12rem)'
const DEFAULT_SPLIT_FLAP_GAP = '0.08em'
const DEFAULT_SPLIT_FLAP_ICON = 're-up.ph'

function getRandomSplitFlapChar() {
  return CHARSET[Math.floor(Math.random() * CHARSET.length)]
}

function SplitFlapTextInner({
  text,
  className = '',
  speed = 50,
  size = DEFAULT_SPLIT_FLAP_SIZE,
  gap = DEFAULT_SPLIT_FLAP_GAP,
  iconName = DEFAULT_SPLIT_FLAP_ICON
}: SplitFlapTextProps) {
  const chars = useMemo(() => text.toUpperCase().split(''), [text])
  const [animationKey, setAnimationKey] = useState(0)
  const audio = useSplitFlapAudio()
  const containerStyle = useMemo(
    () =>
      ({
        perspective: '1000px',
        fontSize: size,
        gap
      }) satisfies React.CSSProperties,
    [gap, size]
  )

  const handleMouseEnter = useCallback(() => {
    setAnimationKey((prev) => prev + 1)
  }, [])

  return (
    <div
      className={`inline-flex items-center cursor-pointer ${className}`}
      aria-label={text}
      onMouseEnter={handleMouseEnter}
      style={containerStyle}>
      {chars.map((char, index) => (
        <SplitFlapChar
          key={`${index}-${char}-${animationKey}`}
          char={char}
          index={index}
          animationKey={animationKey}
          isInitialAnimation={animationKey === 0}
          speed={speed}
          iconName={iconName}
          playClick={audio?.playClick}
        />
      ))}
    </div>
  )
}

export function SplitFlapText(props: SplitFlapTextProps) {
  return <SplitFlapTextInner {...props} />
}

interface SplitFlapCharProps {
  char: string
  index: number
  animationKey: number
  isInitialAnimation: boolean
  speed: number
  iconName: IconName
  playClick?: () => void
}

function SplitFlapChar({
  char,
  index,
  animationKey,
  isInitialAnimation,
  speed,
  iconName,
  playClick
}: SplitFlapCharProps) {
  const isIcon = char === '*'
  const displayChar = CHARSET_SET.has(char) ? char : ' '
  const isSpace = char === ' '
  const [currentChar, setCurrentChar] = useState(() => (isSpace ? ' ' : getRandomSplitFlapChar()))
  const [isSettled, setIsSettled] = useState(isSpace)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggerClickSound = useEffectEvent(() => {
    playClick?.()
  })

  const { theme } = useTheme()

  const tileDelay = 0.15 * index

  const bgColor = isSettled
    ? theme === 'light'
      ? 'hsl(46.66 18% 90%)'
      : 'transparent'
    : theme === 'light'
      ? 'hsl(219.23, 10%, 80%)'
      : 'hsl(219.23, 10%, 20%)'
  const textColor = isSettled
    ? theme === 'light'
      ? 'oklch(0.669 0.219 31.14)'
      : 'hsl(31.06 90% 69%)'
    : theme === 'light'
      ? 'hsl(7.35 100% 60%)'
      : 'hsl(31.06 90% 69%)'

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    if (isSpace) {
      return
    }

    const baseFlips = 4
    const startDelay = isInitialAnimation ? tileDelay * 800 : tileDelay * 300
    let flipIndex = 0
    let hasStartedSettling = false

    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        const settleThreshold = baseFlips + index * 3

        if (flipIndex >= settleThreshold && !hasStartedSettling) {
          hasStartedSettling = true
          if (intervalRef.current) clearInterval(intervalRef.current)
          setCurrentChar(displayChar)
          setIsSettled(true)
          triggerClickSound()
          return
        }
        setCurrentChar(getRandomSplitFlapChar())
        if (flipIndex % 2 === 0) triggerClickSound()
        flipIndex++
      }, speed)
    }, startDelay)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [displayChar, isSpace, tileDelay, isInitialAnimation, index, speed])

  if (isSpace) {
    return (
      <div
        style={{
          width: '0.1em',
          fontSize: '1em'
        }}
      />
    )
  }

  const showIcon = isIcon && isSettled

  return (
    <motion.div
      initial={isInitialAnimation ? { opacity: 0, y: 20 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: tileDelay, duration: 0.3, ease: 'easeOut' }}
      className='relative overflow-hidden flex items-center justify-center font-display'
      style={{
        fontSize: '1em',
        width: '0.65em',
        height: '0.90em',
        backgroundColor: bgColor,
        transformStyle: 'preserve-3d',
        transition: 'background-color 0.15s ease'
      }}>
      <div className='absolute inset-x-0 top-1/2 h-px bg-black/20 pointer-events-none z-10' />

      <div className='absolute inset-x-0 top-0 bottom-1/2 flex items-end justify-center overflow-hidden'>
        {showIcon ? (
          <SplitFlapIconFace iconName={iconName} color={textColor} position='top' />
        ) : (
          <span
            className='block translate-y-[0.52em] leading-none transition-colors duration-150'
            style={{ color: textColor }}>
            {currentChar}
          </span>
        )}
      </div>

      <div className='absolute inset-x-0 top-1/2 bottom-0 flex items-start justify-center overflow-hidden'>
        {showIcon ? (
          <SplitFlapIconFace iconName={iconName} color={textColor} position='bottom' />
        ) : (
          <span
            className='translate-y-[-0.48em] leading-none transition-colors duration-150'
            style={{ color: textColor }}>
            {currentChar}
          </span>
        )}
      </div>

      <motion.div
        key={`${animationKey}-${isSettled}`}
        initial={{ rotateX: -90 }}
        animate={{ rotateX: 0 }}
        transition={{
          delay: isInitialAnimation ? tileDelay + 0.12 : tileDelay * 0.6,
          duration: 0.25,
          ease: [0.22, 0.61, 0.36, 1]
        }}
        className='absolute inset-x-0 top-0 bottom-1/2 origin-bottom overflow-hidden'
        style={{
          backgroundColor: bgColor,
          transformStyle: 'preserve-3d',
          backfaceVisibility: 'hidden',
          transition: 'background-color 0.15s ease'
        }}>
        <div className='flex h-full items-end justify-center'>
          {showIcon ? (
            <SplitFlapIconFace iconName={iconName} color={textColor} position='top' />
          ) : (
            <span
              className='translate-y-[0.52em] leading-none transition-colors duration-150 opacity-60'
              style={{ color: textColor }}>
              {currentChar}
            </span>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

function SplitFlapIconFace({
  iconName,
  color,
  position
}: {
  iconName: IconName
  color: string
  position: 'top' | 'bottom'
}) {
  return (
    <div
      className={`flex h-[0.9em] w-full items-center justify-center px-2.5 ${
        position === 'top' ? 'translate-y-[0.45em]' : 'translate-y-[-0.45em]'
      }`}
      aria-hidden='true'>
      <Icon name={iconName} className='size-8 scale-90 shrink-0 opacity-60' color={color} />
    </div>
  )
}
