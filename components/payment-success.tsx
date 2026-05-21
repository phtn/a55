'use client'

import { Confetti } from '@/components/confetti'
import { Typewrite } from '@/components/text/typewriter'
import { useCopy } from '@/hooks/use-copy'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { motion } from 'motion/react'
import NextLink from 'next/link'
import { useRouter } from 'next/navigation'

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
  className?: string
  selectedNetwork?: string
}

const formatTransactionPreview = (transactionId: string | null | undefined) => {
  if (!transactionId) {
    return 'Ready to settle'
  }

  if (transactionId.length <= 16) {
    return transactionId
  }

  return `${transactionId.slice(0, 8)}...${transactionId.slice(-8)}`
}

export const PaymentSuccess = ({
  orderNumber,
  transactionId,
  title,
  selectedNetwork,
  className
}: PaymentSuccessProps) => {
  const { copy, copied } = useCopy({ timeout: 2000 })
  const router = useRouter()
  const handleCopy = () => {
    if (transactionId) {
      copy('Transaction ID', transactionId)
    }
  }

  const externalRoute = (hash?: string | null) => () => {
    if (hash) {
      if (selectedNetwork === 'ethereum') {
        router.push('https://etherscan.io/tx/' + hash)
      } else if (selectedNetwork === 'polygon') {
        router.push('https://polygonscan.com/tx/' + hash)
      } else if (selectedNetwork === 'sepolia') {
        router.push('https://sepolia.etherscan.io/tx/' + hash)
      } else if (selectedNetwork === 'bitcoin') {
        router.push('https://blockstream.info/tx/' + hash)
      }
    }
  }

  return (
    <div className={cn('relative w-full max-w-4xl px-4 mt-8', className)}>
      <Confetti options={CONFETTI_OPTIONS} className='fixed inset-0 z-10' />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className='relative z-20 overflow-hidden bg-foreground dark:bg-foreground rounded-xs'>
        <div className='absolute bg-[url("/svg/noise.svg")] opacity-15 scale-100 pointer-events-none top-0 left-0 w-full h-full' />
        <div className='relative'>
          <div className='mb-0 flex items-center gap-6 p-6 md:p-8'>
            <div className='flex h-12 w-12 items-center justify-center rounded-full bg-background'>
              <Icon name='check' className='size-7 stroke-0 text-foreground' />
            </div>
            <div className='space-y-1'>
              <p className='font-display font-medium text-background text-xl drop-shadow-xs'>
                {title ?? 'Payment Successful'}
              </p>
              <div className='font-display text-xs sm:text-sm uppercase tracking-wide text-white font-medium flex items-center space-x-2'>
                <span className='font-mono text-background opacity-80'>Order No</span>
                <Icon name='chevrons-right' className='size-5 text-background opacity-70' />
                <span className='tracking-widest font-mono text-background opacity-80'>{orderNumber}</span>
              </div>
            </div>
          </div>

          <div className='flex items-center justify-between w-full px-8 py-4 bg-linear-to-r from-emerald-400/40 via-emerald-400/10 to-transparent'>
            <Typewrite
              onClick={externalRoute(transactionId)}
              speed={10}
              showCursor={false}
              text={'Transaction confirmed!'}
              className='font-display font-medium text-background text-base tracking-wide cursor-pointer'
            />

            <Typewrite
              onClick={handleCopy}
              initialDelay={500}
              speed={10}
              showCursor={false}
              text={(copied ? 'copied' : formatTransactionPreview(transactionId)) + ` ${copied ? '☑' : '☐'}`}
              className='font-mono font-medium text-background text-base tracking-wide cursor-pointer'
            />
          </div>

          <div className='p-4 flex items-end justify-between bg-foreground'>
            {transactionId ? (
              <p className='flex items-center mt-2 font-ios text-xs dark:text-white/60 break-all'>
                txhash: {transactionId.substring(0, 10) + '...' + transactionId.substring(transactionId.length - 10)}
                <Icon
                  name={copied ? 'check' : 'copy'}
                  className='ml-2 h-4 w-4 cursor-pointer'
                  onClick={() => copy('tx', transactionId)}
                />
              </p>
            ) : (
              <div />
            )}
            {orderNumber ? (
              <NextLink
                href={`/account/orders/${orderNumber}`}
                className='h-8 px-4 bg-background text-emerald-700 font-display font-medium flex items-center justify-center'>
                View Order
              </NextLink>
            ) : null}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
