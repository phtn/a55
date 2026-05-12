import { Icon } from '@/lib/icons'
import { AnimatePresence, motion } from 'motion/react'
import { Dispatch, SetStateAction, useState } from 'react'
import { tokenData, TokenDisplay } from './token-display'

interface TokenSelectorProps {
  id: string
  selected: string
  onSelect: Dispatch<SetStateAction<string>>
  excludeToken?: string
}
const tokens = [
  { symbol: 'BTC', balance: 0.0234 },
  { symbol: 'ETH', balance: 1.567821 },
  { symbol: 'USDT', balance: 2500.0 },
  { symbol: 'USDC', balance: 1850.5 },
  { symbol: 'SOL', balance: 45.32 },
  { symbol: 'BNB', balance: 3.21 }
]

export const TokenSelector = ({ id, selected, onSelect, excludeToken }: TokenSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const filteredTokens = tokens.filter((t) => t.symbol !== excludeToken)
  const data = tokenData[selected] || { color: '#6366f1' }

  return (
    <div id={id} className='relative'>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className='w-full flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-300 group'
        style={{ boxShadow: isOpen ? `0 0 20px ${data.color}20` : 'none' }}>
        {/*<TokenDisplay token={selected} balance={selectedToken.balance} size='sm' />*/}
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <Icon name='arrow-right' className='size-5 rotate-90 text-white/10 group-hover:text-white/50' />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='fixed inset-0 z-40'
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.05 }}
              className='absolute min-h-82 z-50 w-full mt-px md:p-2 rounded-xl bg-zinc-950 backdrop-blur-xl border border-white/10 shadow-2xl'>
              {filteredTokens.map((token) => (
                <motion.button
                  key={token.symbol}
                  onClick={() => {
                    onSelect(token.symbol)
                    setIsOpen(false)
                  }}
                  className='w-full md:hover:bg-zinc-100/5 flex items-center justify-between py-4 px-3 rounded-lg transition-colors duration-75'>
                  <TokenDisplay price={token.balance} token={token.symbol} balance={token.balance} size='sm' />
                  {selected === token.symbol && <Icon name='arrow-right' className='w-3 h-3 text-cyan-100/60' />}
                </motion.button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export { tokens }
