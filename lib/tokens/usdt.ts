import type { Address } from 'viem'

/**
 * Official USDT (Tether) contract addresses.
 * @see https://tether.to/
 * @see https://etherscan.io/token/0xdac17f958d2ee523a2206206994597c13d831ec7
 */
export const USDT_ADDRESS_BY_CHAIN_ID: Record<number, Address> = {
  /** Ethereum Mainnet */
  1: '0xdAC17F958D2ee523a2206206994597C13D831ec7' as Address,
  /** Ethereum Sepolia */
  11155111: '0x274ddDb1aa6047E5C3559F633cE261971FEf3257' as Address,
  /** Polygon Mainnet (native USDT) */
  137: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F' as Address,
}

export const SUPPORTED_USDT_CHAINS = [1, 11155111, 137] as const
export type SupportedUsdtChainId = (typeof SUPPORTED_USDT_CHAINS)[number]

export function getUsdtAddress(chainId: number): Address | undefined {
  return USDT_ADDRESS_BY_CHAIN_ID[chainId]
}

export function isUsdtSupportedChain(chainId: number): chainId is SupportedUsdtChainId {
  return SUPPORTED_USDT_CHAINS.includes(chainId as SupportedUsdtChainId)
}

/** Minimal ERC20 ABI for balanceOf and decimals (used with useReadContract). */
export const ERC20_BALANCE_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
] as const
