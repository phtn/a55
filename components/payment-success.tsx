'use client'

import { Confetti } from '@/components/confetti'
import { Typewrite } from '@/components/text/typewriter'
import { useCopy } from '@/hooks/use-copy'
import { Icon } from '@/lib/icons'
import { motion } from 'motion/react'
import NextLink from 'next/link'

const CONFETTI_OPTIONS = {
  particleCount: 220,
  spread: 360,
  startVelocity: 56,
  decay: 0.92,
  gravity: 0.82,
  scalar: 1.08,
  ticks: 340,
  origin: { x: 0.5, y: 0.7 }
}

interface PaymentSuccessProps {
  orderNumber?: string
  transactionId?: string | null
  title?: string
}

export const PaymentSuccess = ({ orderNumber, transactionId, title }: PaymentSuccessProps) => {
  const { copy, copied } = useCopy({ timeout: 2000 })
  return (
    <div className='relative w-full  max-w-2xl px-4'>
      <Confetti options={CONFETTI_OPTIONS} className='fixed inset-0 z-10' />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className='relative z-20 overflow-hidden border-2 border-emerald-600/50 dark:border-emerald-200/50 bg-emerald-500 dark:bg-emerald-500 rounded-xs'>
        <div className='absolute bg-[url("/svg/noise.svg")] opacity-15 scale-100 pointer-events-none top-0 left-0 w-full h-full' />
        <div className='relative'>
          <div className='mb-4 flex items-center gap-6 p-6 md:p-8'>
            <div className='flex h-12 w-12 items-center justify-center rounded-full bg-white'>
              <Icon name='check' className='size-7 text-emerald-500 stroke-0' />
            </div>
            <div>
              <p className='font-clash text-2xl text-emerald-950 dark:text-white drop-shadow-xs'>
                {title ?? 'Payment Successful'}
              </p>
              <div className='font-ios text-xs sm:text-sm uppercase tracking-wide text-white font-medium flex items-center space-x-2'>
                <span className='text-emerald-950 opacity-80'>Order No</span>
                <Icon name='arrow-right' className='size-3.5 text-emerald-950 opacity-70' />
                <strong className='tracking-widest'>{orderNumber}</strong>{' '}
              </div>
            </div>
          </div>

          <div className='flex items-center w-full space-x-4 pl-26 py-6 bg-linear-to-r from-emerald-400/40 via-emerald-400/10 to-transparent'>
            <Icon name='arrow-drop-down' className='size-2.5 -rotate-45 text-emerald-800' />
            <Typewrite
              speed={10}
              showCursor
              text={'Your crypto payment has been confirmed'}
              className='font-clash text-base font-medium text-white tracking-wide'
            />
          </div>

          <div className='p-6 md:p-8 flex items-end justify-between bg-linear-to-l from-emerald-800/10 dark:from-emerald-800/20 dark:via-emerald-700/30 dark:to-emerald-700/20'>
            {transactionId ? (
              <p className='flex items-center mt-2 font-ios text-xs dark:text-white/60 break-all'>
                TX: {transactionId.substring(0, 10) + '...' + transactionId.substring(transactionId.length - 10)}
                <Icon
                  name={copied ? 'check' : 'copy'}
                  className='h-4 w-4 ml-2'
                  onClick={() => copy('tx', transactionId)}
                />
              </p>
            ) : (
              <div />
            )}
            <NextLink
              href={`/account/orders/${orderNumber}`}
              className='h-11 px-6 bg-white text-emerald-700 font-clash font-medium tracking-wider flex items-center justify-center'>
              View Order
            </NextLink>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
