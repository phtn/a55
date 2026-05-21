'use client'

import { Icon, IconName } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { motion } from 'motion/react'
import type { Token } from './token-coaster'
import { tokenIcons } from './token-icons'

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
  payToken
}: PayButtonsProps) => {
  const payTokenIcon: IconName = tokenIcons[payToken as Token]

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
              'font-poly font-semibold flex items-center justify-center w-full mx-auto h-14 bg-foreground text-background text-lg border-0 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed rounded-sm'
            )}>
            {isPayProcessing ? (
              <Icon name='spinner-ring' className='w-5 h-5' />
            ) : (
              <span className='flex items-center font-poly font-medium opacity-100 gap-2 drop-shadow-xs uppercase'>
                {payLabel}
                {payTokenIcon ? (
                  <Icon name={payTokenIcon} className='size-5' />
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
