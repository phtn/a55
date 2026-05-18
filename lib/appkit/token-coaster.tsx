import { Icon, type IconName } from '@/lib/icons'
import { cn } from '@/lib/utils'

export type Token = 'usdc' | 'ethereum' | 'bitcoin' | 'matic' | 'usdt' | 'pol' | 'sepolia'

interface TokenProps {
  token: Token
  nativeSymbol?: string
  size?: 'sm' | 'md' | 'lg'
}

const tokenIconByToken: Record<Token, IconName> = {
  bitcoin: 'btc',
  ethereum: 'eth',
  matic: 'pol',
  pol: 'pol',
  usdc: 'usdc',
  usdt: 'usdt',
  sepolia: 'eth'
}

export const TokenCoaster = ({ token, nativeSymbol, size = 'md' }: TokenProps) => {
  return (
    <div className='size-10 relative flex items-center justify-center'>
      <div className={cn('absolute size-7 aspect-square rounded-full bg-white')} />
      <Icon
        name={tokenIconByToken[token]}
        className={cn('relative size-8 text-foreground', {
          // 'text-foreground': token === 'ethereum',
          // 'text-polygon': token === 'pol' || token === 'matic' || nativeSymbol === 'matic',
          // 'text-bitcoin': token === 'bitcoin',
          // 'text-usdc': token === 'usdc'
        })}
      />
    </div>
  )
}
