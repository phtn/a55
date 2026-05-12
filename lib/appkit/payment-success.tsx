import { Icon } from '@/lib/icons'
import { motion } from 'motion/react'
import { tickerSymbol } from './ticker'

const CONFETTI_COLORS = ['#222222', '#d1499b', '#7dd3fc', '#d1499b', '#111111', '#d1499b'] as const

const CONFETTI_PARTICLES = Array.from({ length: 36 }, (_, index) => {
  const spreadX = ((index * 29) % 240) - 120
  const peakY = -110 - (index % 7) * 16
  const endY = 170 + (index % 6) * 22
  const rotate = ((index * 53) % 720) - 360
  const delay = (index % 12) * 0.03
  const duration = 1.2 + (index % 6) * 0.12
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length]
  const width = 4 + (index % 3)
  const height = 10 + (index % 4) * 2

  return {
    id: index,
    spreadX,
    peakY,
    endY,
    rotate,
    delay,
    duration,
    color,
    width,
    height
  }
})

interface PaymentSuccessProps {
  tokenAmount: string
  tokenSymbol: string
  usdValue: number | null
  hash: `0x${string}` | null
  explorerUrl: string | null
}

export const PaymentSuccess = ({ tokenAmount, tokenSymbol, usdValue, hash, explorerUrl }: PaymentSuccessProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className='relative rounded-3xl border border-emerald-400/30 space-y-0 overflow-hidden'>
      <div className='absolute bg-[url("/svg/noise.svg")] opacity-15 scale-100 pointer-events-none top-0 left-0 w-full h-full' />
      <div aria-hidden className='pointer-events-none absolute inset-0 overflow-hidden '>
        {CONFETTI_PARTICLES.map((particle) => (
          <motion.span
            key={particle.id}
            initial={{ opacity: 0, x: 0, y: 40, rotate: 0 }}
            animate={{
              opacity: [0, 1, 1, 0],
              x: [0, particle.spreadX],
              y: [40, particle.peakY, particle.endY],
              rotate: particle.rotate
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              ease: 'easeOut'
            }}
            style={{
              backgroundColor: particle.color,
              width: particle.width,
              height: particle.height
            }}
            className='absolute top-1/2 left-1/2 rounded-xs'
          />
        ))}
      </div>
      <div className='relative bg-emerald-500/10 px-4 py-6'>
        <div className='flex items-center gap-4'>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className='w-10 h-10 relative rounded-full border-6 border-emerald-300/2 bg-emerald-400/10 backdrop-blur-3xl flex items-center justify-center'>
            <Icon name='arrow-right' className='w-8 h-8 absolute blur-xl text-emerald-300 animate-pulse' />
            <Icon name='arrow-right' className='w-6 h-6 absolute blur-xs text-white' />
            <Icon name='arrow-right' className='w-6 h-6 relative text-emerald-200' />
          </motion.div>
          <div className='space-y-1 w-full'>
            <div className='flex items-center justify-between w-full'>
              <p className='flex text-lg font-polyn font-bold text-emerald-50 w-full'>Transaction Successful</p>
              {hash && (
                <a
                  href={`${explorerUrl}/${hash}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='hover:underline underline-offset-4 decoration-emerald-200 decoration-dotted'>
                  <div className='flex flex-1 space-x-1 text-white font-brk text-xs tracking-widest'>
                    <span>TXN</span>
                    <Icon name='arrow-right' className='size-4 relative text-emerald-200' />
                  </div>
                </a>
              )}
            </div>

            <p className='text-xs text-white font-brk opacity-70'>Your transaction has been confirmed</p>
          </div>
        </div>
        <div className='mt-6 pt-4 border-t border-emerald-200/40 border-dashed space-y-3'>
          <div className='flex items-start justify-between'>
            <span className='text-sm font-polysans font-medium uppercase opacity-80 text-white'>Amount</span>
            <div className='flex flex-col items-end'>
              <span className='text-sm font-okxs text-white'>
                {tokenAmount} <span className='uppercase opacity-70'>{tickerSymbol(tokenSymbol)}</span>
              </span>
              {usdValue !== null && (
                <p className='text-sm font-okxs leading-none flex items-center space-x-1 text-white'>
                  <span className='space-x-1'>
                    <span className='font-medium'>
                      {usdValue.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </span>
                    <span className='opacity-70'>USD</span>
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
