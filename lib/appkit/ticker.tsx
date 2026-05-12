export const tickerSymbol = (token: string) => {
  return tmap[token.toLowerCase()] ?? token.toUpperCase()
}

const tmap: Record<string, string> = {
  ethereum: 'ETH',
  bitcoin: 'BTC',
  usdc: 'USDC',
  usdt: 'USDT',
  polygon: 'POL',
  matic: 'POL',
}
