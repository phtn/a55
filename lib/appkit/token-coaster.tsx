import { Icon, type IconName } from '@/lib/icons'
import { cn } from '@/lib/utils'

export type Token = 'usdc' | 'ethereum' | 'bitcoin' | 'matic' | 'usdt' | 'pol'

interface TokenProps {
  token: Token
  nativeSymbol?: string
  size?: 'sm' | 'md' | 'lg'
}

const tokenIconByToken: Record<Token, IconName> = {
  bitcoin: 'bet69',
  ethereum: 'bet69',
  matic: 'bet69',
  pol: 'bet69',
  usdc: 'bet69',
  usdt: 'bet69'
}

export const TokenCoaster = ({ token, nativeSymbol, size = 'md' }: TokenProps) => {
  return (
    <div className='size-10 relative flex items-center justify-center'>
      <div className={cn('absolute size-7 aspect-square rounded-full', { 'bg-white': token === 'usdc' })} />
      <Icon
        name={tokenIconByToken[token]}
        className={cn('relative size-8 text-usdc', {
          'text-white': token === 'ethereum',
          'text-polygon': token === 'pol' || token === 'matic' || nativeSymbol === 'matic',
          'text-bitcoin': token === 'bitcoin',
          'text-usdc': token === 'usdc'
        })}
      />
    </div>
  )
}
