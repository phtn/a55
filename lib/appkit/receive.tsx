import { Icon } from '@/lib/icons'
import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Title } from './components'
import { TokenSelector } from './token-selector'

export const ReceiveTab = () => {
  const [selectedToken, setSelectedToken] = useState('ETH')
  const [copied, setCopied] = useState(false)
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const walletAddress = '0x1a2B3c4D5e6F7g8H9i0J1k2L3m4N5o6P7q8R9s0T'

  const handleCopy = () => {
    // Clear any existing timeout
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current)
      copyTimeoutRef.current = null
    }

    navigator.clipboard.writeText(walletAddress)
    setCopied(true)
    copyTimeoutRef.current = setTimeout(() => {
      setCopied(false)
      copyTimeoutRef.current = null
    }, 2000)
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current)
        copyTimeoutRef.current = null
      }
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className='space-y-6'>
      <div>
        <Title id='receive-token-selector'>Tokens</Title>
        <TokenSelector id='receive-token-selector' selected={selectedToken} onSelect={setSelectedToken} />
      </div>

      {/* QR Code Display */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className='flex justify-center'>
        <div className='relative p-4 rounded-3xl bg-linear-to-br from-white/10 to-white/5 border border-white/10'>
          <div className='absolute inset-0 rounded-2xl bg-linear-to-br from-cyan-500/10 to-purple-500/10 blur-xl' />
          <div className='relative bg-white p-4 rounded-xl'>
            {/* Simulated QR Code Pattern */}
            <div className='w-40 h-40 grid grid-cols-12 gap-1px'>
              {Array.from({ length: 128 }, (_, i) => i % 3 === 0 || i % 5 === 0 || i % 7 === 0 || i % 6 === 0).map(
                (isBlack, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.005 }}
                    className={`${isBlack ? 'bg-gray-900' : 'bg-transparent'}`}
                  />
                )
              )}
            </div>
            <div className='absolute inset-0 flex items-center justify-center'>
              <div className='bg-white rounded-full border-2 border-zinc-900 w-auto h-12 aspect-square flex items-center justify-center'>
                <Icon name='bet69' className='size-7 text-indigo-500' />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Wallet Address */}
      <div className='space-y-2'>
        <label className='block text-sm font-medium text-white/60'>Your {selectedToken} Address</label>
        <motion.div whileHover={{ scale: 1.01 }} className='relative group'>
          <div className='absolute inset-0 bg-linear-to-r from-cyan-500/20 to-purple-500/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
          <div className='relative flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 group-hover:border-white/20 transition-colors'>
            <Icon name='bet69' className='w-5 h-5 text-cyan-400 shrink-0' />
            <p className='text-white/80 text-sm font-mono truncate flex-1'>{walletAddress}</p>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleCopy}
              className='shrink-0 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors'>
              {copied ? (
                <Icon name='bet69' className='w-4 h-4 text-emerald-400' />
              ) : (
                <Icon name='x' className='w-4 h-4 text-white/60' />
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className='p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20'>
        <p className='text-sm text-cyan-300/80'>
          Only send <span className='font-semibold text-cyan-300'>{selectedToken}</span> to this address. Sending any
          other asset may result in permanent loss.
        </p>
      </motion.div>
    </motion.div>
  )
}
