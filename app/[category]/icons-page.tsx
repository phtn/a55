'use client'

import { useCopy } from '@/hooks/use-copy'
import { Icon, IconName } from '@/lib/icons'
import { icons } from '@/lib/icons/icons'
import { cn } from '@/lib/utils'
import { useMemo, useState } from 'react'

export const IconsPage = () => {
  const [iconSize] = useState(24)
  const [searchQuery] = useState('')
  const { copy, copied } = useCopy({ timeout: 1500 })

  // Memoize filtered icons to prevent unnecessary recalculations
  const filteredIcons = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    return Object.keys(icons).filter((name) => name.toLowerCase().includes(query))
  }, [searchQuery])

  return (
    <div className='min-h-screen w-[calc(100vw-216px)] overflow-x-hidden'>
      <div className='h-16 font-okx font-semibold text-lg flex items-center justify-start space-x-4'>
        <h1 className='tracking-tight'>Icons</h1>
        <span
          className={cn('flex items-center justify-center w-8 aspect-square text-base px-2 text-foreground', {
            'text-orange-300': filteredIcons.length === 0
          })}>
          {filteredIcons.length}
        </span>

        <div className='flex items-center justify-center w-full gap-12'>
          {/*<input
            className='w-36 placeholder:text-sm'
            value={searchQuery}
            placeholder='filter'
            onChange={(e) => setSearchQuery(e.target.value)}
          />*/}
          {/*<Slider
                min={16}
                max={64}
                step={8}
                value={[iconSize]}
                onValueChange={(value) => setIconSize(value[0])}
                className='w-32'
              />*/}
          <div className='w-24 flex items-center justify-center'>
            {copied && <div className='uppercase text-xs px-1 py-0.5'>Copied ✓</div>}
          </div>
        </div>
      </div>
      <div className='mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 xl:grid-cols-8 gap-4'>
        {filteredIcons.map((name) => (
          <div
            key={name}
            className='flex flex-col group aspect-square items-center justify-center p-4'
            onClick={() => copy('name', name as IconName)}>
            <Icon
              name={name as IconName}
              solid
              size={iconSize}
              className='group-hover:scale-150 transition-transform duration-300'
            />
            <span className='text-xs mt-2 group-hover:translate-y-8 transition-transform duration-300'>{name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
