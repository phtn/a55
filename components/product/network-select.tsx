'use client'

import { Field } from '@/components/ui/field'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DEFAULT_ALLOWED_PAY_NETWORKS, type PayNetworkName } from '@/lib/appkit/pay-config'
import { Icon, type IconName } from '@/lib/icons'
import { useMemo } from 'react'

interface Item {
  label: string
  value: PayNetworkName
  icon: IconName
}

const networkConfig: Record<PayNetworkName, Omit<Item, 'value'>> = {
  bitcoin: {
    label: 'Bitcoin',
    icon: 'btc'
  },
  ethereum: {
    label: 'Ethereum',
    icon: 'eth'
  },
  polygon: {
    label: 'Polygon',
    icon: 'pol'
  },
  sepolia: {
    label: 'Sepolia',
    icon: 'eth'
  },
  amoy: {
    label: 'Amoy',
    icon: 'pol'
  }
}

interface NetworkSelectProps {
  allowedNetworks?: readonly PayNetworkName[]
  onValueChange: (network: PayNetworkName) => void
  value: PayNetworkName | null
}

export const NetworkSelect = ({
  allowedNetworks = DEFAULT_ALLOWED_PAY_NETWORKS,
  onValueChange,
  value
}: NetworkSelectProps) => {
  const items = useMemo<Item[]>(
    () => allowedNetworks.map((network) => ({ value: network, ...networkConfig[network] })),
    [allowedNetworks]
  )
  const selected = useMemo(() => items.find((item) => item.value === value) ?? null, [items, value])

  return (
    <Field id='network-select' className='max-w-xs'>
      <Select value={selected} items={items} onValueChange={(item) => item?.value && onValueChange(item.value)}>
        <SelectTrigger className='w-xs bg-background border-background rounded-md' size='lg'>
          <SelectValue placeholder='Network'>
            {(item: Item) => (
              <span className='flex items-center gap-2 font-display text-base w-28'>
                <Icon name={item.icon ?? 'globe'} className='size-5' />
                <span>{item.label}</span>
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          <SelectGroup>
            {items.map((item) => (
              <SelectItem key={item.value} value={item} className='flex items-center'>
                <Icon name={item.icon} className='size-5 my-auto' />
                <span className='flex items-center font-display text-base'>{item.label}</span>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  )
}
