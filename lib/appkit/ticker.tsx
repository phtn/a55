import { IconName } from '../icons'

export const tickerSymbol = (token: string) => {
  return tmap[token.toLowerCase()] ?? token.toUpperCase()
}

const tmap: Record<string, IconName> = {
  ethereum: 'eth',
  bitcoin: 'btc',
  usdc: 'usdc',
  usdt: 'usdt',
  polygon: 'pol',
  matic: 'pol'
}
