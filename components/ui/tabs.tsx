'use client'

import { Tabs as Root } from '@base-ui/react/tabs'
import { ReactNode, useState } from 'react'

interface TabsProps {
  tabs: Tab[]
}

export interface Tab {
  value: string
  label: string
  content?: ReactNode
}

export const Tabs = ({ tabs }: TabsProps) => {
  const firstValue = tabs[0]?.value ?? null
  const [value, setValue] = useState<string | null>(firstValue)
  const activeValue = value !== null && tabs.some((tab) => tab.value === value) ? value : firstValue

  return (
    <Root.Root
      className='rounded-md'
      value={activeValue}
      onValueChange={(nextValue) => setValue(typeof nextValue === 'string' ? nextValue : firstValue)}>
      <Root.List className='relative z-0 flex gap-4'>
        {tabs.map((tab, index) => (
          <Root.Tab
            key={tab.value}
            className={`flex h-7 items-center justify-center border-0 px-2 text-sm font-normal break-keep whitespace-nowrap text-foreground/60 outline-hidden select-none before:inset-x-0 before:inset-y-1 before:rounded-xs before:-outline-offset-1 before:outline-blue-800 hover:text-foreground focus-visible:relative focus-visible:before:absolute focus-visible:before:outline-2 data-active:text-background ${index === 0 ? 'first:ml-1' : ''}`}
            value={tab.value}>
            {tab.label}
          </Root.Tab>
        ))}

        <Root.Indicator className='absolute top-1/2 left-0 z-[-1] h-6 w-(--active-tab-width) translate-x-(--active-tab-left) -translate-y-1/2 rounded-xs bg-gray-100 transition-all duration-200 ease-in-out' />
      </Root.List>
      <section className='min-h-64 mt-4'>
        {tabs.map((tab) => (
          <Root.Panel key={tab.value} className='h-fit' value={tab.value}>
            {tab?.content}
          </Root.Panel>
        ))}
      </section>
    </Root.Root>
  )
}
