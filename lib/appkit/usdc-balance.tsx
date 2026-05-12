'use client'

import { useUsdcBalance } from '@/hooks/use-usdc-balance'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'

export interface UsdcBalanceProps {
  className?: string
  /** Show compact view (e.g. "1,234.56 USDC") */
  compact?: boolean
}

/**
 * Displays the connected wallet's USDC balance on the current chain.
 * Supported: Ethereum Mainnet, Sepolia, Polygon Mainnet.
 * Uses useReadContract (wagmi) per @reown-appkit for contract reads.
 */
export function UsdcBalance({ className, compact = false }: UsdcBalanceProps) {
  const { formatted, isLoading, error, isSupported } = useUsdcBalance()

  if (!isSupported) {
    return (
      <span className={cn('text-white/40 text-sm', className)} title='USDC not supported on this chain'>
        — USDC
      </span>
    )
  }

  if (error) {
    return (
      <span className={cn('text-red-400/80 text-sm', className)} title={error.message}>
        USDC error
      </span>
    )
  }

  if (isLoading) {
    return (
      <span className={cn('flex items-center gap-1.5 text-white/60 text-sm', className)}>
        <Icon name='spinner-ring' className='size-3.5 opacity-70' />
        USDC…
      </span>
    )
  }

  const num = Number.parseFloat(formatted)
  const display = Number.isNaN(num)
    ? '0'
    : num.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6
      })

  if (compact) {
    return <span className={cn('font-okxs text-xl font-semibold text-white/80', className)}>{display}</span>
  }

  return (
    <span className={cn('flex items-center gap-1.5 font-okxs text-sm', className)}>
      <div className='size-5 relative'>
        <div className='bg-white absolute size-5 aspect-square rounded-full' />
        <Icon name='bet69' className='relative size-5 text-usdc' />
      </div>
      <span className='text-white/90'>{display}</span>
      <span className='text-white/50'>USDC</span>
    </span>
  )
}
