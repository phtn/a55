export interface CMCQuote {
  price: number
  volume_24h: number
  volume_change_24h: number
  percent_change_1h: number
  percent_change_24h: number
  percent_change_7d: number
  percent_change_30d: number
  percent_change_60d: number
  percent_change_90d: number
  market_cap: number
  market_cap_dominance: number
  fully_diluted_market_cap: number
  last_updated: string
}

export interface CMCCryptocurrency {
  id: number
  name: string
  symbol: string
  slug: string
  num_market_pairs: number
  date_added: string
  tags: string[]
  max_supply: number | null
  circulating_supply: number
  total_supply: number
  infinite_supply: boolean
  platform: {
    id: number
    name: string
    symbol: string
    slug: string
    token_address: string
  } | null
  cmc_rank: number
  self_reported_circulating_supply: number | null
  self_reported_market_cap: number | null
  tvl_ratio: number | null
  last_updated: string
  quote: {
    USD: CMCQuote
  }
}

export interface CMCListingsResponse {
  status: {
    timestamp: string
    error_code: number
    error_message: string | null
    elapsed: number
    credit_count: number
    notice: string | null
    total_count: number
  }
  data: CMCCryptocurrency[]
}

export interface CryptoQuote {
  id: number
  rank: number
  name: string
  symbol: string
  slug: string
  price: number
  percentChange1h: number
  percentChange24h: number
  percentChange7d: number
  marketCap: number
  volume24h: number
  circulatingSupply: number
  maxSupply: number | null
  lastUpdated: string
  tags: string[]
}

export interface CryptoApiResponse {
  success: boolean
  data: CryptoQuote[]
  timestamp: string
  error?: string
}

export interface TxData {
  id: string
  from: string
  to: string
  value: string
  gasUsed: string
  gasPrice: string
  status: string
  blockNumber: string
  contractAddress: string | null
}

export interface Tx {
  blockHash: string
  blockNumber: string
  blockTimestamp: string
  from: string
  gas: string
  gasPrice: string
  maxFeePerGas: string
  maxPriorityFeePerGas: string
  hash: string
  input: string
  nonce: string
  to: string
  transactionIndex: string
  value: string
  type: string
  accessList: unknown[]
  chainId: string
  v: string
  r: string
  s: string
  yParity: string
}

export interface TxReceipt {
  blockHash: string
  blockNumber: string
  contractAddress: null
  cumulativeGasUsed: string
  effectiveGasPrice: string
  from: string
  gasUsed: string
  logs: unknown[]
  logsBloom: string
  status: string
  to: string
  transactionHash: string
  transactionIndex: string
  type: string
}
