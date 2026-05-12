'use client'

import { useMemo } from 'react'
import { useReadContract } from 'wagmi'
import { formatUnits, isAddress, type Address } from 'viem'
import {
  ERC20_BALANCE_ABI,
  getUsdcAddress,
  isUsdcSupportedChain,
} from '@/lib/usdc'
import { useAppKitAccount } from '@reown/appkit/react'
import { useChainId } from 'wagmi'

export interface UsdcBalanceResult {
  /** Raw balance (smallest units). */
  value: bigint
  /** Human-readable balance. */
  formatted: string
  /** Token decimals (USDC = 6). */
  decimals: number
  /** Loading state. */
  isLoading: boolean
  /** Error if any. */
  error: Error | null
  /** Whether the current chain supports USDC. */
  isSupported: boolean
}

/**
 * Fetches the connected wallet's USDC balance on the current chain.
 * Supports Ethereum Mainnet, Sepolia, and Polygon Mainnet.
 *
 * Uses `useReadContract` (wagmi) per @reown-appkit: read from smart contracts
 * with balanceOf + decimals. Ensure wallet is connected and on a supported chain.
 */
export function useUsdcBalance(): UsdcBalanceResult {
  const { address } = useAppKitAccount({ namespace: 'eip155' })
  const chainId = useChainId()
  const evmAddress = useMemo<Address | undefined>(
    () => (address && isAddress(address) ? address : undefined),
    [address]
  )
  const usdcAddress = useMemo(
    () => (isUsdcSupportedChain(chainId) ? getUsdcAddress(chainId) : undefined),
    [chainId]
  )

  const {
    data: balanceRaw,
    isLoading: balanceLoading,
    error: balanceError,
  } = useReadContract({
    abi: ERC20_BALANCE_ABI,
    address: usdcAddress,
    functionName: 'balanceOf',
    args: evmAddress ? [evmAddress] : undefined,
    query: { enabled: Boolean(evmAddress && usdcAddress) },
  })

  const { data: decimalsRaw } = useReadContract({
    abi: ERC20_BALANCE_ABI,
    address: usdcAddress,
    functionName: 'decimals',
    query: { enabled: Boolean(usdcAddress) },
  })

  const decimals = decimalsRaw !== undefined ? Number(decimalsRaw) : 6
  const value = balanceRaw ?? BigInt(0)
  const formatted = useMemo(
    () => formatUnits(value, decimals),
    [value, decimals]
  )

  const isLoading = Boolean(usdcAddress && balanceLoading)
  const error = balanceError ?? null
  const isSupported = Boolean(usdcAddress)

  return {
    value,
    formatted,
    decimals,
    isLoading,
    error,
    isSupported,
  }
}
