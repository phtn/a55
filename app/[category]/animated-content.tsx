'use client'

import { Content } from '@/app/content'
import gsap from 'gsap'
import { useEffect, useRef } from 'react'
import { IconsPage } from './icons-page'

interface AnimatedContentProps {
  category: string
}

export const AnimatedContent = ({ category }: AnimatedContentProps) => {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!rootRef.current) {
      return
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    const ctx = gsap.context(() => {
      const items = rootRef.current?.querySelectorAll('main > *')

      gsap.from(rootRef.current, {
        x: -18,
        opacity: 0,
        duration: 0.55,
        ease: 'power3.out'
      })

      if (items?.length) {
        gsap.from(items, {
          x: -28,
          opacity: 0,
          duration: 0.75,
          stagger: 0.12,
          ease: 'power3.out',
          delay: 0.15
        })
      }
    }, rootRef)

    return () => ctx.revert()
  }, [category])

  switch (category) {
    case 'funding':
      break
    case 'transfer':
      break
    case 'icons':
      return (
        <div ref={rootRef}>
          <IconsPage />
        </div>
      )
    case 'bets':
      break
    default:
      return (
        <div ref={rootRef}>
          <Content category={category} />
        </div>
      )
  }
}
