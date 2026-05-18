import { useTheme } from '@/components/theme-provider'
import { Icon } from '@/lib/icons'
import { motion } from 'motion/react'
import { PixelGrid } from 'three-px-react'
import { tickerSymbol } from './ticker'
interface PaymentProcessingProps {
  tokenAmount: string
  tokenSymbol: string
  usdValue: number | null
}

export const PaymentProcessing = ({ tokenAmount, tokenSymbol, usdValue }: PaymentProcessingProps) => {
  const { resolvedTheme } = useTheme()
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className='relative rounded-lg dark:bg-dark-table/5 bg-foreground border border-dark-table/10 space-y-0 overflow-hidden'>
      <div className='absolute bg-[url("/svg/noise.svg")] opacity-15 scale-100 pointer-events-none top-0 left-0 w-full h-full' />
      <div className='relative px-4 py-6'>
        <div className='flex flex-col items-center justify-center gap-4'>
          <div className='relative w-12 h-12 flex items-center justify-center'>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              className='w-12 h-12 rounded-full border-2 border-background/50 border-t-background flex items-center justify-center'></motion.div>

            <div className='absolute w-7 h-7 border border-transparent rounded-full aspect-square overflow-hidden flex items-center justify-center'>
              {/*<Icon name='spinner-blocks' className='size-5 text-lime-300' />*/}
              <PixelGrid
                animation='snake'
                color={resolvedTheme === 'dark' ? '#f5f5f5' : '#CCC'}
                className=''
                duration={1200}
              />
            </div>
            <div className='absolute w-5 h-5 border border-transparent rounded-full aspect-square overflow-hidden flex items-center justify-center blur-sm'>
              <Icon name='spinner-ring' className='size-5 text-lime-100/80' />
            </div>
          </div>
          <div className='text-center space-y-1'>
            <p className='font-poly font-semibold text-lg text-white/80'>Processing Payment</p>
            <p className='font-display text-white/70 text-sm'>Please confirm in your wallet</p>
          </div>
        </div>
        <div className='hidden mt-6 pt-4 border-t border-white/10 border-dashed space-y-3'>
          <div className='flex items-center justify-between'>
            <span className='text-sm font-polysans font-medium uppercase text-white opacity-70'>Amount</span>
            <div className='text-right flex flex-col items-end'>
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
