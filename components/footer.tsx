'use client'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useEffect, useRef } from 'react'
import { Header } from './header'

gsap.registerPlugin(ScrollTrigger)

export const FooterSection = () => {
  const sectionRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sectionRef.current) return

    const ctx = gsap.context(() => {
      // Header slide in
      if (headerRef.current) {
        gsap.from(headerRef.current, {
          x: -60,
          opacity: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: headerRef.current,
            start: 'top 95%',
            toggleActions: 'play none none reverse'
          }
        })
      }

      // Grid columns fade up with stagger
      if (gridRef.current) {
        const columns = gridRef.current.querySelectorAll(':scope > div')
        gsap.from(columns, {
          y: 40,
          opacity: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: gridRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse'
          }
        })
      }

      // Footer fade in
      if (footerRef.current) {
        gsap.from(footerRef.current, {
          y: 20,
          opacity: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: footerRef.current,
            start: 'top 85%',
            invalidateOnRefresh: true,
            toggleActions: 'play none none reverse'
          }
        })
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id='footer' className='relative pt-2 pl-6 md:pl-8 pr-6 md:pr-8 lg:ml-54'>
      {/* Section header */}
      <Header title='Footer Section' tag='QUICK LINKS' id='+' ref={headerRef} />

      {/* Multi-column layout */}
      <div ref={gridRef} className='grid grid-cols-2 md:grid-cols-3 gap-8'>
        {/* Payment Methods */}
        <div className='col-span-1'>
          <ColumnHeader title='API' />
          <ColumnItems items={[{ id: 'cards', name: 'Get API Keys' }]} />
        </div>

        {/* Alternative Rails */}
        <div className='col-span-1'>
          <ColumnHeader title='DOCS' />
          <ColumnItems items={[{ id: 'cards', name: 'Get Started' }]} />
        </div>

        {/* Connectivity */}
        <div className='col-span-1'>
          <ColumnHeader title='HELP' />
          <ColumnItems items={[{ id: 'multi-chain', name: 'Support' }]} />
        </div>
      </div>

      {/* Bottom copyright */}
      <div
        ref={footerRef}
        className='mt-4 pt-8 border-t border-border/20 flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
        <p className='font-mono text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground'>
          © 2026 c-layer. All rights reserved.
        </p>
        <p className='font-mono text-[11px] font-medium uppercase tracking-[0.28em] text-foreground/45'>
          Designed to Scale Fast
        </p>
      </div>
    </section>
  )
}

const ColumnHeader = ({ title }: { title: string }) => {
  return (
    <h4 className='font-ios font-extrabold text-[9px] uppercase tracking-[0.25em] dark:text-border text-secondary-foreground mb-4'>
      {title}
    </h4>
  )
}

const ColumnItems = ({ items }: { items: { id: string; name: string }[] }) => {
  return (
    <ul className='space-y-2.5'>
      {items.map((item) => (
        <li key={item.id} className='font-ct font-medium text-xs text-foreground/80 tracking-widest'>
          {item.name}
        </li>
      ))}
    </ul>
  )
}
