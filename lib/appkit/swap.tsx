import { Icon } from '@/lib/icons'
import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { tokenData } from './token-display'
import { TokenSelector } from './token-selector'

type SwapPair = 'ETH-USDT' | 'ETH-BTC' | 'BTC-USDT' | 'SOL-USDT'

export const SwapTab = () => {
  const [fromToken, setFromToken] = useState('ETH')
  const [toToken, setToToken] = useState('USDT')
  const [fromAmount, setFromAmount] = useState('')
  const [isSwapping, setIsSwapping] = useState(false)
  const swapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const exchangeRates: Record<SwapPair, number> = {
    'ETH-USDT': 3245.67,
    'ETH-BTC': 0.052,
    'BTC-USDT': 62450.0,
    'SOL-USDT': 142.35
  }

  const getRate = () => {
    const key = `${fromToken}-${toToken}`
    const reverseKey = `${toToken}-${fromToken}`
    if (exchangeRates[key as SwapPair]) return exchangeRates[key as SwapPair]
    if (exchangeRates[reverseKey as SwapPair]) return 1 / exchangeRates[reverseKey as SwapPair]
    return 1
  }

  const toAmount = fromAmount ? (parseFloat(fromAmount) * getRate()).toFixed(6) : ''

  const handleSwapTokens = () => {
    const temp = fromToken
    setFromToken(toToken)
    setToToken(temp)
    setFromAmount('')
  }

  const handleSwap = () => {
    // Clear any existing timeout
    if (swapTimeoutRef.current) {
      clearTimeout(swapTimeoutRef.current)
      swapTimeoutRef.current = null
    }

    setIsSwapping(true)
    swapTimeoutRef.current = setTimeout(() => {
      setIsSwapping(false)
      swapTimeoutRef.current = null
    }, 2000)
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (swapTimeoutRef.current) {
        clearTimeout(swapTimeoutRef.current)
        swapTimeoutRef.current = null
      }
    }
  }, [])

  const fromData = tokenData[fromToken] || { color: '#6366f1' }
  const toData = tokenData[toToken] || { color: '#6366f1' }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className='space-y-4'>
      {/* From Token */}
      <div className='space-y-2'>
        <div className='flex justify-between items-center'>
          <label className='text-sm font-medium text-white/60'>From</label>
          <button className='text-xs text-cyan-400 hover:text-cyan-300 transition-colors'>Max</button>
        </div>
        <div className='p-4 rounded-xl bg-white/5 border border-white/10 space-y-3'>
          <TokenSelector id='swap-token-selector' selected={fromToken} onSelect={setFromToken} excludeToken={toToken} />
          <div className='relative'>
            <input
              id='swap-token-selector'
              type='number'
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              placeholder='0.00'
              className='w-full bg-transparent text-3xl font-light text-white placeholder-white/20 outline-none'
            />
            <div
              className='absolute bottom-0 left-0 right-0 h-0.5 rounded-full transition-all duration-300'
              style={{
                background: fromAmount ? `linear-gradient(90deg, ${fromData.color}, transparent)` : 'transparent'
              }}
            />
          </div>
        </div>
      </div>

      {/* Swap Button */}
      <div className='flex justify-center -my-2 relative z-10'>
        <motion.button
          whileHover={{ scale: 1.1, rotate: 180 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleSwapTokens}
          className='p-3 rounded-xl bg-linear-to-br from-cyan-500/20 to-purple-500/20 border border-white/10 hover:border-white/30 transition-all shadow-lg'
          style={{ boxShadow: '0 0 30px rgba(6, 182, 212, 0.2)' }}>
          <Icon name='arrow-right' className='w-5 h-5 text-cyan-400' />
        </motion.button>
      </div>

      {/* To Token */}
      <div className='space-y-2'>
        <label className='text-sm font-medium text-white/60'>To</label>
        <div className='p-4 rounded-xl bg-white/5 border border-white/10 space-y-3'>
          <TokenSelector id='swap-to-token' selected={toToken} onSelect={setToToken} excludeToken={fromToken} />
          <div className='relative'>
            <input
              id='swap-to-token'
              type='text'
              value={toAmount}
              readOnly
              placeholder='0.00'
              className='w-full bg-transparent text-3xl font-light text-white/60 placeholder-white/20 outline-none cursor-not-allowed'
            />
            <div
              className='absolute bottom-0 left-0 right-0 h-0.5 rounded-full transition-all duration-300'
              style={{
                background: toAmount ? `linear-gradient(90deg, ${toData.color}, transparent)` : 'transparent'
              }}
            />
          </div>
        </div>
      </div>

      {/* Exchange Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className='p-4 rounded-xl bg-white/5 border border-white/10 space-y-3'>
        <div className='flex items-center justify-between text-sm'>
          <span className='text-white/50 flex items-center gap-2'>
            <Icon name='arrow-right' className='w-4 h-4' />
            Exchange Rate
          </span>
          <span className='text-white font-medium'>
            1 {fromToken} = {getRate().toLocaleString()} {toToken}
          </span>
        </div>
        <div className='flex items-center justify-between text-sm'>
          <span className='text-white/50 flex items-center gap-2'>
            <Icon name='t' className='w-4 h-4' />
            Network Fee
          </span>
          <span className='text-white font-medium'>~$2.45</span>
        </div>
        <div className='flex items-center justify-between text-sm'>
          <span className='text-white/50 flex items-center gap-2'>
            <Icon name='arrow-right' className='w-4 h-4' />
            Estimated Time
          </span>
          <span className='text-emerald-400 font-medium'>~30 seconds</span>
        </div>
      </motion.div>

      {/* Swap Button */}
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <button
          onClick={handleSwap}
          disabled={!fromAmount || isSwapping}
          className='w-full h-14 text-lg font-semibold rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border-0 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed'
          style={{ boxShadow: '0 10px 40px rgba(6, 182, 212, 0.3)' }}>
          {isSwapping ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
              <Icon name='arrow-right' className='w-5 h-5' />
            </motion.div>
          ) : (
            'Swap Tokens'
          )}
        </button>
      </motion.div>
    </motion.div>
  )
}
