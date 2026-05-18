'use client'

import { Field } from '@/components/ui/field'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Icon, type IconName } from '@/lib/icons'
import { useQueryState } from 'nuqs'
import { useMemo } from 'react'

interface Item {
  label: string
  value: string | null
  icon: IconName
}

const items: Item[] = [
  {
    label: 'Network',
    value: null,
    icon: 'eth'
  },
  {
    label: 'Ethereum',
    value: 'ethereum',
    icon: 'eth'
  },
  {
    label: 'Polygon',
    value: 'polygon',
    icon: 'pol'
  },
  {
    label: 'Bitcoin',
    value: 'bitcoin',
    icon: 'btc'
  }
]

export function SelectDemo() {
  const [network] = useQueryState('network')
  const selected = useMemo(() => items.find((i) => i.value === network), [network])
  return (
    <Field className='max-w-xs'>
      <Select defaultValue={selected} items={items}>
        <SelectTrigger className='w-xs'>
          <SelectValue>
            {(item: Item) => (
              <span className='flex items-center gap-2'>
                {item?.icon && <Icon name={item.icon} />}
                <span>{item.label}</span>
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          <SelectGroup>
            {items.slice(1).map((item) => (
              <SelectItem key={item.value} value={item}>
                <Icon name={item.icon} className='size-4' />
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  )
}
