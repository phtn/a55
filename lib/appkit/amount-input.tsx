import { motion } from 'motion/react'
import { ChangeEvent, Ref } from 'react'
import { Title, USDValue } from './components'
import { Balance, TokenData } from './types'

interface AmountInputProps {
  amountInputRef: Ref<HTMLInputElement>
  balance: Balance | null
  formattedBalance: string | null
  onChange: (amount: string) => void
  tokenData: TokenData
  usdValue: number | null
  amount?: string
}

export const AmountInputField = ({
  amountInputRef,
  balance,
  formattedBalance,
  onChange,
  tokenData,
  usdValue,
  amount = ''
}: AmountInputProps) => {
  const handleAmountChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    onChange(value)
  }

  const handleMaxClick = () => formattedBalance && onChange(formattedBalance)

  return (
    <motion.div key='input' initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className='flex justify-between items-center'>
        <Title id='send-amount'>amount</Title>
        <button onClick={handleMaxClick} className='text-xs md:hover:text-indigo-300 transition-colors mr-4 mb-2'>
          <span className='uppercase font-okxs font-bold text-indigo-200'>Max</span>{' '}
          <span className='font-okxs'>{formattedBalance}</span>
          <span className='font-okxs font-light opacity-50 ml-1'>{balance?.symbol}</span>
        </button>
      </div>
      <div className='space-y-0 overflow-hidden'>
        <div
          className='relative rounded-2xl border border-zinc-700 overflow-hidden'
          style={{
            backgroundColor: `${tokenData?.color ?? '#000'}5`,
            borderColor: `${tokenData?.color ?? '#000'}40`
          }}>
          {/* Crypto gradient accent */}
          <div
            id='crypto-gradient-accent'
            style={{ backgroundColor: tokenData?.color ?? '#000', filter: 'blur(64px)' }}
            className='absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20'
          />

          <div className='relative px-4 py-4'>
            {' '}
            <div className='absolute top-2 right-2.5 flex items-center gap-1'>
              <div className='w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse' />
              <span className='text-[9px] md:text-[8px] uppercase font-brk text-white/60'>Live</span>
            </div>
            <input
              id='send-amount'
              ref={amountInputRef}
              type='number'
              value={amount}
              onChange={handleAmountChange}
              placeholder='0.00'
              className='w-full bg-transparent text-2xl font-okxs font-light text-white placeholder-white/20 outline-none'
            />
            <div
              className='absolute -bottom-px left-0 right-0 h-px rounded-full transition-all duration-300'
              style={{
                background: amount ? `linear-gradient(30deg, ${tokenData.color}80, transparent)` : 'transparent'
              }}
            />
          </div>
          <div className='flex items-center justify-between h-10 pl-4 pb-2'>
            {usdValue !== null && <USDValue value={usdValue} />}
          </div>
        </div>
      </div>
      {/* Quick Amount Buttons */}
      <div className='grid grid-cols-4 gap-2 mb-4 mt-6'>
        {[25, 50, 75, 100].map((percent) => (
          <motion.button
            key={percent}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (formattedBalance) {
                onChange(((+formattedBalance * percent) / 100).toFixed(6))
              }
            }}
            className='py-2 font-okxs font-bold rounded-lg bg-zinc-100/20 border border-zinc-200/15 text-white/70 text-sm hover:bg-zinc-100/5 hover:text-white transition-all'>
            <span className='font-exo'>{percent}</span>
            <span className='text-xs'>%</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}
