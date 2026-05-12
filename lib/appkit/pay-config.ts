import {mainnet, polygon, polygonAmoy, sepolia} from '@reown/appkit/networks'
import type {Token} from './token-coaster'

export type EvmPayToken = 'ethereum' | 'usdc' | 'usdt'
export type PayNetworkName = 'bitcoin' | EvmNetworkName

const ALL_TOKENS: readonly Token[] = [
  'usdc',
  'ethereum',
  'bitcoin',
  'matic',
  'usdt',
]
const EVM_PAY_TOKENS: readonly EvmPayToken[] = ['ethereum', 'usdc', 'usdt']

const allTokenSet = new Set<Token>(ALL_TOKENS)
const evmPayTokenSet = new Set<EvmPayToken>(EVM_PAY_TOKENS)

export const parseTokenParam = (
  value: string | null | undefined,
): Token | null =>
  value && allTokenSet.has(value as Token) ? (value as Token) : null

export const isEvmPayToken = (token: Token | null): token is EvmPayToken =>
  token ? evmPayTokenSet.has(token as EvmPayToken) : false

export const EVM_NETWORKS = [
  {
    name: 'sepolia',
    chainId: sepolia.id,
    nativeSymbol: 'ethereum',
    priceSymbol: 'ETH',
  },
  {
    name: 'ethereum',
    chainId: mainnet.id,
    nativeSymbol: 'ethereum',
    priceSymbol: 'ETH',
  },
  {
    name: 'polygon',
    chainId: polygon.id,
    nativeSymbol: 'matic',
    priceSymbol: 'POL',
  },
  {
    name: 'amoy',
    chainId: polygonAmoy.id,
    nativeSymbol: 'matic',
    priceSymbol: 'POL',
  },
] as const

export type EvmNetworkName = (typeof EVM_NETWORKS)[number]['name']

export const DEFAULT_ALLOWED_PAY_NETWORKS: readonly PayNetworkName[] = [
  'bitcoin',
  'ethereum',
  'polygon',
]

const chainIdByNetwork = new Map<EvmNetworkName, number>(
  EVM_NETWORKS.map((network) => [network.name, network.chainId]),
)

const networkByChainId = new Map<number, (typeof EVM_NETWORKS)[number]>(
  EVM_NETWORKS.map((network) => [network.chainId, network]),
)

export const getChainIdForNetwork = (network: string): number | null =>
  chainIdByNetwork.get(network as EvmNetworkName) ?? null

export const getNetworkForChainId = (chainId: number): EvmNetworkName | null =>
  networkByChainId.get(chainId)?.name ?? null

export const getNativeSymbolForChainId = (
  chainId: number,
): 'ethereum' | 'matic' =>
  networkByChainId.get(chainId)?.nativeSymbol ?? 'ethereum'

export const getPriceSymbolForChainId = (chainId: number): 'ETH' | 'POL' =>
  networkByChainId.get(chainId)?.priceSymbol ?? 'ETH'

export const getTokenFractionDigits = (token: Token | null): number =>
  token === 'usdc' || token === 'usdt' ? 6 : 8
