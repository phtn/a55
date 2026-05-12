import { Icon, IconName } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { ClassName } from '@/types'
import { useCallback } from 'react'
import { Chain } from 'viem'

type NetworkHeaderProps = {
  chain: Chain | undefined
  address: string | undefined
}

const ICON_MAP: Record<Chain['name'], IconName> = {
  ethereum: 'bet69',
  polygon: 'bet69',
  sepolia: 'bet69',
  'polygon amoy': 'bet69'
}
const ICON_CMAP: Record<Chain['name'], ClassName> = {
  ethereum: 'text-ethereum',
  polygon: 'text-polygon',
  sepolia: 'text-rose-400',
  'polygon amoy': 'text-rose-300'
}

const getIconName = (chainName: string): IconName => {
  return ICON_MAP[chainName] || 'ethereum'
}

const getIconClass = (chainName: string): ClassName => {
  return ICON_CMAP[chainName] || 'text-rose-400'
}

export const NetworkHeader = ({ chain, address }: NetworkHeaderProps) => {
  const NetworkIcon = useCallback(
    () => (
      <Icon
        name={getIconName(chain?.name.toLowerCase() || 'ethereum')}
        className={cn(`size-3.5`, getIconClass(chain?.name.toLowerCase() || 'ethereum'))}
      />
    ),
    [chain]
  )
  return (
    <div className='flex flex-col gap-2 mt-10 md:mt-2 mb-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-0'>
          {chain ? NetworkIcon() : null}
          <span className='font-okxs tracking-tight'>{chain?.name}</span>
        </div>
        {address ? (
          <span className='font-brk text-xs text-lime-100'>
            {address?.substring(0, 4)}...{address?.substring(address?.length - 6)}
          </span>
        ) : (
          <Icon name='re-up.ph' className='size-4 opacity-50' />
        )}
      </div>
    </div>
  )
}
