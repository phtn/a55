import {TokenBalance} from '@/hooks/use-network-tokens'
import {motion} from 'motion/react'
import {Dispatch, SetStateAction} from 'react'
import {Title} from './components'
import {Token} from './token-coaster'

interface AmountPayInputProps {
  selectedTokenBalance: TokenBalance | null
  tokenAmount: number | null
  selectedToken: Token | null
  paymentAmountUsd: string
  setPaymentAmountUsd: Dispatch<SetStateAction<string>>
  getTokenPrice: (token: Token | null) => number | null
}
export const AmountPayInput = ({
  selectedTokenBalance,
  tokenAmount,
  selectedToken,
  paymentAmountUsd,
  setPaymentAmountUsd,
  getTokenPrice,
}: AmountPayInputProps) => {
  return (
    <motion.div
      layout
      initial={{opacity: 0, y: 10}}
      animate={{opacity: 1, y: 0}}
      exit={{opacity: 0, y: -10}}
      transition={{layout: {duration: 0.3, ease: 'easeInOut'}}}
      className='mt-4 hidden '>
      <div className='flex justify-between items-center mb-2'>
        <Title id='pay-amount'>Amount to Pay (USD)</Title>
        {selectedTokenBalance && tokenAmount && (
          <button
            onClick={() => {
              // Set max USD amount based on token balance
              const balance = Number.parseFloat(selectedTokenBalance.formatted)
              const price = getTokenPrice(selectedToken)
              if (price) {
                setPaymentAmountUsd((balance * price).toFixed(2))
              }
            }}
            className='text-xs md:hover:text-indigo-300 transition-colors'>
            <span className='uppercase font-okxs font-bold dark:text-indigo-200'>
              Max
            </span>{' '}
            <span className='font-okxs'>
              {tokenAmount.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6,
              })}
            </span>
            <span className='font-okxs font-light opacity-50 ml-1 uppercase'>
              {selectedToken}
            </span>
          </button>
        )}
      </div>
      <div className='relative rounded-2xl border border-zinc-700 overflow-hidden bg-zinc-900/50'>
        <div className='relative px-4 py-4'>
          <div className='flex items-center gap-2'>
            <span className='dark:text-white/40 text-lg'>$</span>
            <input
              id='pay-amount'
              type='number'
              value={paymentAmountUsd}
              onChange={(e) => setPaymentAmountUsd(e.target.value)}
              placeholder='0.00'
              step='0.01'
              min='0'
              className='w-full bg-transparent text-2xl font-okxs font-light text-white placeholder-white/20 outline-none'
            />
          </div>
          {tokenAmount && (
            <div className='mt-2 text-sm dark:text-white/50'>
              ≈{' '}
              {tokenAmount.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6,
              })}{' '}
              <span className='uppercase'>{selectedToken}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
