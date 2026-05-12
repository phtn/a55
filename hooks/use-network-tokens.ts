'use client'

import type {Token} from '@/lib/appkit/token-coaster'
import {config} from '@/ctx/wagmi/config'
import {
  ERC20_BALANCE_ABI,
  getUsdcAddress,
  isUsdcSupportedChain,
} from '@/lib/usdc'
import {
  ERC20_BALANCE_ABI as USDT_ERC20_BALANCE_ABI,
  getUsdtAddress,
  isUsdtSupportedChain,
} from '@/lib/usdt'
import {useAppKitAccount} from '@reown/appkit/react'
import {getBalance} from '@wagmi/core'
import {useEffect, useMemo, useState} from 'react'
import {formatUnits, isAddress, type Address} from 'viem'
import {useChainId, useReadContract} from 'wagmi'

export interface TokenBalance {
  token: Token
  value: bigint
  formatted: string
  decimals: number
  isLoading: boolean
  error: Error | null
}

export interface NetworkTokensResult {
  tokens: TokenBalance[]
  isLoading: boolean
}

/**
 * Fetches token balances for the current network.
 * Returns tokens with balance > 0 (ETH native balance, USDC and USDT if supported and have balance).
 */
export function useNetworkTokens(): NetworkTokensResult {
  const {address} = useAppKitAccount({namespace: 'eip155'})
  const chainId = useChainId()
  const evmAddress = useMemo<Address | undefined>(
    () => (address && isAddress(address) ? address : undefined),
    [address],
  )

  // Get USDC address if supported
  const usdcAddress = useMemo(
    () => (isUsdcSupportedChain(chainId) ? getUsdcAddress(chainId) : undefined),
    [chainId],
  )

  // Get USDT address if supported
  const usdtAddress = useMemo(
    () => (isUsdtSupportedChain(chainId) ? getUsdtAddress(chainId) : undefined),
    [chainId],
  )

  // Fetch native ETH balance
  const [ethBalance, setEthBalance] = useState<bigint | null>(null)
  const [ethLoading, setEthLoading] = useState(false)
  const [ethError, setEthError] = useState<Error | null>(null)

  // Fetch USDC balance
  const {
    data: usdcBalanceRaw,
    isLoading: usdcLoading,
    error: usdcError,
  } = useReadContract({
    abi: ERC20_BALANCE_ABI,
    address: usdcAddress,
    functionName: 'balanceOf',
    args: evmAddress ? [evmAddress] : undefined,
    query: {enabled: Boolean(evmAddress && usdcAddress)},
  })

  const {data: usdcDecimalsRaw} = useReadContract({
    abi: ERC20_BALANCE_ABI,
    address: usdcAddress,
    functionName: 'decimals',
    query: {enabled: Boolean(usdcAddress)},
  })

  // Fetch USDT balance
  const {
    data: usdtBalanceRaw,
    isLoading: usdtLoading,
    error: usdtError,
  } = useReadContract({
    abi: USDT_ERC20_BALANCE_ABI,
    address: usdtAddress,
    functionName: 'balanceOf',
    args: evmAddress ? [evmAddress] : undefined,
    query: {enabled: Boolean(evmAddress && usdtAddress)},
  })

  const {data: usdtDecimalsRaw} = useReadContract({
    abi: USDT_ERC20_BALANCE_ABI,
    address: usdtAddress,
    functionName: 'decimals',
    query: {enabled: Boolean(usdtAddress)},
  })

  // Fetch ETH balance
  useEffect(() => {
    if (!evmAddress) {
      setEthBalance(null)
      setEthLoading(false)
      return
    }

    setEthLoading(true)
    getBalance(config, {
      address: evmAddress,
      chainId,
    })
      .then((bal) => {
        setEthBalance(bal.value)
        setEthError(null)
      })
      .catch((err) => {
        setEthError(err as Error)
        setEthBalance(null)
      })
      .finally(() => {
        setEthLoading(false)
      })
  }, [evmAddress, chainId])

  const usdcDecimals =
    usdcDecimalsRaw !== undefined ? Number(usdcDecimalsRaw) : 6
  const usdcValue = usdcBalanceRaw ?? BigInt(0)
  const usdcFormatted = useMemo(
    () => formatUnits(usdcValue, usdcDecimals),
    [usdcValue, usdcDecimals],
  )

  const usdtDecimals =
    usdtDecimalsRaw !== undefined ? Number(usdtDecimalsRaw) : 6
  const usdtValue = usdtBalanceRaw ?? BigInt(0)
  const usdtFormatted = useMemo(
    () => formatUnits(usdtValue, usdtDecimals),
    [usdtValue, usdtDecimals],
  )

  const ethFormatted = useMemo(() => {
    if (!ethBalance) return '0'
    // ETH uses 18 decimals
    return formatUnits(ethBalance, 18)
  }, [ethBalance])

  // Build token balances array
  const tokens = useMemo<TokenBalance[]>(() => {
    const result: TokenBalance[] = []

    // Add ETH if balance > 0
    if (ethBalance && ethBalance > BigInt(0)) {
      result.push({
        token: 'ethereum',
        value: ethBalance,
        formatted: ethFormatted,
        decimals: 18,
        isLoading: ethLoading,
        error: ethError,
      })
    }

    // Add USDC if balance > 0 and supported
    if (usdcAddress && usdcValue > BigInt(0)) {
      result.push({
        token: 'usdc',
        value: usdcValue,
        formatted: usdcFormatted,
        decimals: usdcDecimals,
        isLoading: usdcLoading,
        error: usdcError as Error | null,
      })
    }

    // Add USDT if balance > 0 and supported
    if (usdtAddress && usdtValue > BigInt(0)) {
      result.push({
        token: 'usdt',
        value: usdtValue,
        formatted: usdtFormatted,
        decimals: usdtDecimals,
        isLoading: usdtLoading,
        error: usdtError as Error | null,
      })
    }

    return result
  }, [
    ethBalance,
    ethFormatted,
    ethLoading,
    ethError,
    usdcAddress,
    usdcValue,
    usdcFormatted,
    usdcDecimals,
    usdcLoading,
    usdcError,
    usdtAddress,
    usdtValue,
    usdtFormatted,
    usdtDecimals,
    usdtLoading,
    usdtError,
  ])

  const isLoading = ethLoading || usdcLoading || usdtLoading

  return {
    tokens,
    isLoading,
  }
}
