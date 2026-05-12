import type {TokenBalance} from '@/hooks/use-network-tokens'
import {cn} from '@/lib/utils'
import {motion} from 'motion/react'
import {useMemo} from 'react'
import {Token} from './token-coaster'
import {TokenModern} from './token-modern'

interface TokensProps {
  tokens: Token[]
  excludeToken?: Token
  tokenBalances?: TokenBalance[]
  selectedToken?: Token | null
  paymentAmountUsd?: string
  tokenPrices?: {
    usdc: number
    usdt?: number
    ethereum: number | null
    bitcoin?: number | null
  }
  /** Symbol for the native gas token (e.g. 'ETH' or 'MATIC'). Used when token is 'ethereum'. */
  nativeSymbol?: string
  listHeightClassName?: string
  onTokenSelect?: (token: Token) => void
}

export const Tokens = ({
  tokens,
  excludeToken,
  tokenBalances = [],
  selectedToken,
  paymentAmountUsd = '',
  tokenPrices,
  nativeSymbol,
  listHeightClassName,
  onTokenSelect,
}: TokensProps) => {
  const filteredTokens = useMemo(
    () => tokens.filter((t) => t !== excludeToken),
    [tokens, excludeToken],
  )

  // Create a map of token balances for quick lookup
  const balanceMap = new Map<Token, TokenBalance>()
  tokenBalances.forEach((tb) => {
    balanceMap.set(tb.token, tb)
  })

  const handleTokenSelect = (token: Token) => () => {
    onTokenSelect?.(token)
  }

  // Get token price
  const getTokenPrice = (token: Token): number | null => {
    if (!tokenPrices) return null
    if (token === 'usdc') return tokenPrices.usdc
    if (token === 'usdt') return tokenPrices.usdt ?? 1
    if (token === 'ethereum') return tokenPrices.ethereum
    if (token === 'bitcoin') return tokenPrices.bitcoin ?? null
    return null
  }

  return (
    <div
      className={cn(
        'relative max-h-0 h-64 transition-transform duration-300',
        listHeightClassName,
        {
          'max-h-full': filteredTokens.length > 1,
        },
      )}>
      <motion.div
        initial={{opacity: 0, y: -2, scale: 0.95}}
        animate={{opacity: 1, y: 0, scale: 1}}
        exit={{opacity: 0, y: 20, scale: 0.95}}
        transition={{duration: 0.15, ease: 'easeInOut'}}
        className='absolute z-50 w-full p-1 mt-px overflow-hidden'>
        {filteredTokens.map((token, i) => {
          const tokenBalance = balanceMap.get(token)
          const balance = tokenBalance
            ? Number.parseFloat(tokenBalance.formatted)
            : 0
          const price = getTokenPrice(token)

          // Check if this token has insufficient balance
          // Convert USD amount to token amount and compare with balance
          const usdAmount = Number.parseFloat(paymentAmountUsd)
          const tokenPrice = getTokenPrice(token)
          const tokenAmount =
            tokenPrice && !Number.isNaN(usdAmount) && usdAmount > 0
              ? usdAmount / tokenPrice
              : 0
          const hasInsufficientBalance =
            paymentAmountUsd &&
            !Number.isNaN(usdAmount) &&
            usdAmount > 0 &&
            tokenAmount > balance

          return (
            <motion.button
              key={token}
              onClick={handleTokenSelect(token)}
              initial={{opacity: 0, y: 20, scale: 0.95}}
              animate={{opacity: 1, y: 0, scale: 1}}
              transition={{duration: 0.3, ease: 'easeOut', delay: 0.1 * i}}
              className={cn(
                'relative w-full flex items-start justify-between py-3 px-4 transition-colors duration-75',
                'transition-colors duration-75 cursor-pointer rounded-xl',
                {
                  'bg-brand text-white': selectedToken === token,
                },
              )}>
              <div className='flex items-center gap-3 flex-1 min-w-0'>
                <TokenModern
                  isSelected={selectedToken === token}
                  isInsufficient={hasInsufficientBalance}
                  price={price ?? 0}
                  token={token}
                  balance={balance}
                  size='sm'
                  nativeSymbol={nativeSymbol}
                />
              </div>
            </motion.button>
          )
        })}
      </motion.div>
    </div>
  )
}
