import { HyperList } from '@/components/hyperlist'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { motion } from 'motion/react'
import { useMemo } from 'react'
import { DEFAULT_ALLOWED_PAY_NETWORKS, type PayNetworkName } from './pay-config'

interface NetworkSelectorProps {
  currentNetwork: string | null
  onSelectNetwork: (network: string) => () => void
  allowedNetworks?: readonly PayNetworkName[]
}

export const NetworkSelector = ({
  currentNetwork,
  onSelectNetwork,
  allowedNetworks = DEFAULT_ALLOWED_PAY_NETWORKS
}: NetworkSelectorProps) => {
  const network_list = useMemo(() => {
    return allowedNetworks.map((net) => ({
      name: net,
      onSelect: onSelectNetwork(net),
      selected: currentNetwork === net
    }))
  }, [allowedNetworks, currentNetwork, onSelectNetwork])
  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.6 }}
        transition={{ duration: 0.2 }}
        className='flex flex-col md:space-x-8 md:justify-between px-1 md:px-3 py-6 md:py-6 border-b-[0.33px] border-white/0 w-full'>
        <div className='flex items-center space-x-0.5 md:space-x-2 opacity-80 ps-1 md:ps-2 pb-3'>
          <Icon name='bet69' className='opacity-70 size-4 md:size-5' />
          <span className='flex font-brk text-xs uppercase'>Select Network</span>
          <Icon name='arrow-right' className='md:flex hidden size-3 opacity-80' />
        </div>
        <HyperList
          direction='up'
          data={network_list}
          component={NetworkButtonRound}
          container='w-full flex items-center justify-around py-1'
        />
      </motion.div>
    </>
  )
}

interface NetworkButtonRoundProps {
  name: PayNetworkName
  onSelect: VoidFunction
  selected: boolean
}
const NetworkButtonRound = ({ name, onSelect, selected }: NetworkButtonRoundProps) => {
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onSelect}
      // disabled={name === 'bitcoin'}
      className={cn(
        'relative flex items-center justify-center w-auto h-7 px-2 rounded-full overflow-hidden space-x-1 mx-2',
        {
          'dark:bg-white dark:text-dark-table bg-dark-table text-white': selected,
          'hover:bg-white/2 ': !selected,
          'cursor-pointer': true
        }
      )}>
      <Icon
        name={
          name === 'bitcoin'
            ? 'btc'
            : name === 'sepolia'
              ? 'eth'
              : name === 'polygon' || name === 'amoy'
                ? 'pol'
                : 'eth'
        }
        className={cn('dark:text-slate-300 size-4', {
          'size-4': selected,
          'text-foreground': name === 'sepolia' && selected,
          'dark:text-foreground text-foreground': name === 'polygon' && selected,
          'text-foreground dark:bg-ethereum': name === 'ethereum' && selected,
          'text-foreground dark:text-amoy': name === 'amoy' && selected,
          'text-foreground dark:text-bitcoin': name === 'bitcoin' && selected
        })}
      />
      <p
        className={cn('font-brk opacity-80 text-sm capitalize', {
          'opacity-100 max-w-[8ch]': selected
        })}>
        {/*{name === 'bitcoin' && !selected ? 'BTC' : name}*/}
        {name}
      </p>
    </motion.button>
  )
}
{
  /*{allowedNetworks.map((net, i) => {
        const isActive = currentNetwork === net
        return (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: i * 0.033 * 1.03 }}
            key={net}
            onClick={onSelectNetwork(net)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'relative flex items-center justify-center -space-x-0.5 py-1 px-1.5 h-8 overflow-hidden rounded-lg transition-colors',
              {
                'bg-white/5 border-[0.33px]': isActive,
                'hover:bg-white/2 ': !isActive,
                'cursor-pointer': true
              },
              {
                'border-rose-400/70': net === 'sepolia',
                'border-rose-300/70': net === 'amoy',
                'border-ethereum/70': net === 'ethereum',
                'border-polygon/70': net === 'polygon'
              }
            )}>
            <Icon
              name={net === 'sepolia' ? 'ethereum' : net === 'polygon' || net === 'amoy' ? 'polygon' : 'ethereum'}
              className={cn('absolute left-1 blur-sm -rotate-30 text-zinc-100/30 size-7 opacity-50', {
                'opacity-100': isActive,
                'text-rose-400': net === 'sepolia' && isActive,
                'text-polygon font-semibold': net === 'polygon' && isActive,
                'text-ethereum': net === 'ethereum' && isActive,
                'text-rose-300': net === 'amoy' && isActive
              })}
            />
            <Icon
              name={net === 'sepolia' ? 'ethereum' : net === 'polygon' || net === 'amoy' ? 'polygon' : 'ethereum'}
              className={cn('text-zinc-300/20 size-4', {
                'text-rose-400': net === 'sepolia' && isActive,
                'text-polygon': net === 'polygon' && isActive,
                'text-ethereum': net === 'ethereum' && isActive,
                'text-rose-300': net === 'amoy' && isActive
              })}
            />
            <span
              className={cn('lowercase drop-shadow-xs opacity-50 text-sm', {
                ' font-polyn font-bold': net === 'polygon' || net === 'amoy',
                ' font-bold tracking-tight': net === 'ethereum',
                'font-normal font-okxs tracking-tight': net === 'sepolia',
                'opacity-100': isActive
              })}>
              {net}
            </span>
          </motion.button>
        )
      })}*/
}
