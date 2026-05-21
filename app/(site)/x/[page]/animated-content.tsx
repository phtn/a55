'use client'

import { Page } from '@/types/dashboard'
import gsap from 'gsap'
import { Suspense, useEffect, useRef } from 'react'
import { Content } from '../content'
import { BetsPage } from './bets-page'
import { Stakes } from './stakes-page'

interface AnimatedContentProps {
  page: Page
}

const C = ({ page }: AnimatedContentProps) => {
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
    case 'stakes':
      return <Stakes />
    case 'bets':
      return (
        <div ref={rootRef}>
          <BetsPage />
        </div>
      )
    default:
      return (
        <div ref={rootRef}>
          <Content />
        </div>
      )
  }
}

export const AnimatedContent = ({ page }: AnimatedContentProps) => (
  <Suspense fallback={<div>Loading...</div>}>
    <C page={page} />
  </Suspense>
)
