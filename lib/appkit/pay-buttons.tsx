'use client'

import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { motion } from 'motion/react'
import type { Token } from './token-coaster'

interface PayButtonsProps {
  showReceiptButton: boolean
  onViewReceipt: VoidFunction
  onPay: VoidFunction
  isPayDisabled: boolean
  isPayProcessing: boolean
  payLabel: string
  enablePayHoverStyles: boolean
  payToken: Token | null
  nativeSymbol: 'ethereum' | 'matic'
}

export const PayButtons = ({
  showReceiptButton,
  onViewReceipt,
  onPay,
  isPayDisabled,
  isPayProcessing,
  payLabel,
  enablePayHoverStyles,
  payToken,
  nativeSymbol
}: PayButtonsProps) => {
  const payTokenIcon = payToken === 'ethereum' ? (nativeSymbol === 'matic' ? 'matic' : 'ethereum') : payToken

  return (
    <motion.div layout>
      <motion.div
        whileHover={{ scale: isPayDisabled ? 1 : 1.02 }}
        whileTap={{ scale: 0.98 }}
        className='mt-8 mx-2 md:mx-4'>
        {showReceiptButton ? (
          <button
            onClick={onViewReceipt}
            className='hidden _flex items-center justify-center w-full mx-auto h-14 text-lg font-medium rounded-xl bg-linear-to-r from-slate-500 via-slate-400 to-cyan-100 hover:from-slate-500 hover:to-slate-100 text-white border-0 shadow-lg transition-all'>
            <span className='flex items-center font-exo font-semibold italic gap-2'>
              View Receipt
              <Icon name='bet69' className='w-5 h-5' />
            </span>
          </button>
        ) : (
          <button
            onClick={onPay}
            disabled={isPayDisabled}
            className={cn(
              'flex items-center justify-center w-full mx-auto h-14 text-lg font-semibold bg-linear-to-r from-slate-500/80 via-slate-600 to-slate-500/80 text-white border-0 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed rounded-sm',
              {
                'hover:from-slate-500 hover:to-slate-400': enablePayHoverStyles
              }
            )}>
            {isPayProcessing ? (
              <Icon name='spinner-ring' className='w-5 h-5' />
            ) : (
              <span className='flex items-center font-polysans font-medium text-white opacity-100 gap-2 drop-shadow-xs'>
                {payLabel}
                {payTokenIcon ? (
                  <Icon name={'bet69'} className='size-5 text-white' />
                ) : (
                  <Icon name='arrow-right' className='size-6' />
                )}
              </span>
            )}
          </button>
        )}
      </motion.div>
    </motion.div>
  )
}
