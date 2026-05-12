import { Icon } from '@/lib/icons'
import { motion } from 'motion/react'

export const LowBalance = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0.5, y: 20 }}
      className='p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 mx-auto max-w-xs'>
      <Icon name='alert-triangle' className='w-4 h-4 text-red-400 shrink-0' />
      <p className='text-sm text-red-300'>Insufficient balance for this transaction</p>
    </motion.div>
  )
}
