'use client'

import {useAppKitAccount} from '@reown/appkit/react'
import {useCallback, useEffect, useState} from 'react'

interface BitcoinBalanceApiResponse {
  symbol: 'BTC'
  balanceSats: string
  balanceBtc: string
}

export interface BitcoinBalanceResult {
  address: string | null
  symbol: 'BTC'
  balanceSats: bigint
  balanceBtc: string
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

const DEFAULT_BALANCE_BTC = '0'
const BITCOIN_ADDRESS_PATTERN =
  /^(bc1[ac-hj-np-z02-9]{11,71}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/i

function normalizeBitcoinAddress(value: string | null | undefined) {
  const candidate = value?.trim()

  if (!candidate) {
    return null
  }

  const address = candidate.includes(':') ? candidate.split(':').at(-1) : candidate

  return address && BITCOIN_ADDRESS_PATTERN.test(address) ? address : null
}

export function useBitcoinBalance(
  enabled: boolean,
  addressOverride?: string | null,
): BitcoinBalanceResult {
  const {address: walletAddress} = useAppKitAccount({namespace: 'bip122'})
  const [balanceSats, setBalanceSats] = useState<bigint>(BigInt(0))
  const [balanceBtc, setBalanceBtc] = useState<string>(DEFAULT_BALANCE_BTC)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const address =
    normalizeBitcoinAddress(walletAddress) ??
    normalizeBitcoinAddress(addressOverride)

  const refetch = useCallback(async () => {
    if (!enabled || !address) {
      setBalanceSats(BigInt(0))
      setBalanceBtc(DEFAULT_BALANCE_BTC)
      setError(null)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/bitcoin/address/${encodeURIComponent(address)}`,
      )
      if (!response.ok) {
        throw new Error('Failed to fetch Bitcoin balance')
      }

      const payload = (await response.json()) as BitcoinBalanceApiResponse
      setBalanceSats(BigInt(payload.balanceSats))
      setBalanceBtc(payload.balanceBtc)
      setError(null)
    } catch (err) {
      setBalanceSats(BigInt(0))
      setBalanceBtc(DEFAULT_BALANCE_BTC)
      setError(
        err instanceof Error
          ? err
          : new Error('Unable to fetch Bitcoin balance'),
      )
    } finally {
      setIsLoading(false)
    }
  }, [address, enabled])

  useEffect(() => {
    void refetch()
  }, [refetch])

  useEffect(() => {
    if (!enabled || !address) return

    const intervalId = setInterval(() => {
      void refetch()
    }, 15_000)

    return () => clearInterval(intervalId)
  }, [address, enabled, refetch])

  return {
    address: address ?? null,
    symbol: 'BTC',
    balanceSats,
    balanceBtc,
    isLoading,
    error,
    refetch,
  }
}
