import { Icon, IconName } from '@/lib/icons'
import { motion } from 'motion/react'

const tokenData: Record<string, { name: string; color: string; icon: IconName }> = {
  BTC: { name: 'Bitcoin', color: '#f7931a', icon: 'bet69' },
  ETH: { name: 'Ethereum', color: '#627eea', icon: 'bet69' },
  USDT: { name: 'Tether', color: '#26a17b', icon: 'bet69' },
  USDC: { name: 'USD Coin', color: '#2775ca', icon: 'bet69' },
  SOL: { name: 'Solana', color: '#9945ff', icon: 'bet69' },
  BNB: { name: 'BNB', color: '#f0b90b', icon: 'bet69' }
}

interface TokenDisplayProps {
  token: string | null
  balance: number | null
  showBalance?: boolean
  price: number | null
  size?: 'sm' | 'md' | 'lg'
}

export const TokenDisplay = ({ token, balance, price, showBalance = true, size = 'md' }: TokenDisplayProps) => {
  const sizes = {
    sm: { icon: 'w-8 h-8 text-sm', text: 'text-sm', balance: 'text-xs' },
    md: { icon: 'w-10 h-10 text-base', text: 'text-base', balance: 'text-sm' },
    lg: { icon: 'w-12 h-12 text-lg', text: 'text-lg', balance: 'text-base' }
  }

  return (
    <div className='flex items-center justify-start w-full gap-1'>
      <motion.div
        whileHover={{ scale: 1.05 }}
        className={`relative ${sizes[size].icon} rounded-full flex items-center justify-center w-auto h-6 md:h-7 aspect-square`}>
        <Icon name='bet69' className='size-6 md:size-6 absolute z-5 text-indigo-400/60 blur-xl' />
        <Icon name='bet69' className='size-5 md:size-5 absolute z-10 text-indigo-400' />
      </motion.div>
      <div className='flex items-center justify-between w-full'>
        <p className={`text-left space-x-1`}>
          <span className='font-okxs font-normal text-indigo-100 text-lg'>
            {balance?.toLocaleString('en-US', { maximumFractionDigits: 11 })}
          </span>
          <span className='text-white/50 font-okxs font-light text-xs px-0.5'>{token}</span>
        </p>
        {showBalance && (
          <p className={`md:text-base text-sm font-brk px-2`}>
            <span className='font-okxs font-light pr-0.5 opacity-80'>$</span>
            <span className='font-normal font-okxs'>
              {((balance ?? 0) * (price ?? 1)).toLocaleString('en-US', {
                maximumFractionDigits: 2,
                currency: 'USD',
                currencyDisplay: 'symbol'
              })}
            </span>
          </p>
        )}
      </div>
    </div>
  )
}

export { tokenData }
