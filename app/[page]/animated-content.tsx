'use client'

import { Content } from '@/app/content'
import { Page } from '@/types/dashboard'
import gsap from 'gsap'
import { useEffect, useRef } from 'react'
import { Explore } from './explore'
import { IconsPage } from './icons-page'
import { Markets } from './markets'

interface AnimatedContentProps {
  page: Page
}

export const AnimatedContent = ({ page }: AnimatedContentProps) => {
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
  }, [page])

  switch (page) {
    case 'markets':
      return <Markets />
    case 'explore':
      return <Explore />
    case 'icons':
      return (
        <div ref={rootRef}>
          <IconsPage />
        </div>
      )
    default:
      return (
        <div ref={rootRef}>
          <Content page={page} />
        </div>
      )
  }
}
