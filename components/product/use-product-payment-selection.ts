'use client'

import { useBitcoinBalance } from '@/hooks/use-bitcoin-balance'
import { useCrypto } from '@/hooks/use-crypto'
import { useExchangeRate } from '@/hooks/use-exchange-rate'
import { useNetworkTokens, type TokenBalance } from '@/hooks/use-network-tokens'
import { useSearchParams } from '@/lib/appkit/params-ctx'
import {
  DEFAULT_ALLOWED_PAY_NETWORKS,
  getChainIdForNetwork,
  getNetworkForChainId,
  getPriceSymbolForChainId,
  parseTokenParam,
  type PayNetworkName
} from '@/lib/appkit/pay-config'
import type { Token } from '@/lib/appkit/token-coaster'
import { bitcoin, mainnet, polygon, polygonAmoy, sepolia } from '@reown/appkit/networks'
import { useAppKit, useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react'
import { useCallback, useEffect, useMemo, useTransition } from 'react'
import { useChainId, useSwitchChain } from 'wagmi'

const BITCOIN_ADDRESS_PATTERN = /^(bc1[ac-hj-np-z02-9]{11,71}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/i

const EVM_APPKIT_NETWORKS = {
  ethereum: mainnet,
  polygon,
  sepolia,
  amoy: polygonAmoy
} as const

interface UseProductPaymentSelectionOptions {
  allowedNetworks?: readonly PayNetworkName[]
  requiredPhpValue?: number
}

export interface ProductPaymentTokenOption {
  token: Token
  balance: number
  formattedBalance: string
  isDisabled: boolean
  usdValue: number | null
}

export const useProductPaymentSelection = ({
  allowedNetworks = DEFAULT_ALLOWED_PAY_NETWORKS,
  requiredPhpValue = 0
}: UseProductPaymentSelectionOptions = {}) => {
  const { params, setParams } = useSearchParams()
  const { open: openAppKit } = useAppKit()
  const { getBySymbol, isPending: isCryptoLoading } = useCrypto()
  const {
    data: phpUsdRate,
    error: exchangeRateError,
    isPending: isExchangeRateLoading
  } = useExchangeRate('PHP', 'USD')
  const { address: evmWalletAddress, isConnected: isEvmWalletConnected } = useAppKitAccount({
    namespace: 'eip155'
  })
  const { isConnected: isBitcoinWalletConnected } = useAppKitAccount({
    namespace: 'bip122'
  })
  const { caipNetwork, switchNetwork: switchAppKitNetwork } = useAppKitNetwork()
  const chainId = useChainId()
  const { mutateAsync: switchChain } = useSwitchChain()
  const { tokens: networkTokens, isLoading: isNetworkTokensLoading } = useNetworkTokens()
  const [, startTransition] = useTransition()

  const allowedNetworkSet = useMemo(() => new Set<PayNetworkName>(allowedNetworks), [allowedNetworks])
  const currentEvmNetwork = useMemo(() => getNetworkForChainId(chainId), [chainId])
  const selectedToken = parseTokenParam(params.tokenSelected)

  const persistedBitcoinAddress = useMemo(() => {
    const candidate = params.walletAddress ?? params.btcAddress
    if (!candidate) return null
    return BITCOIN_ADDRESS_PATTERN.test(candidate) ? candidate : null
  }, [params.btcAddress, params.walletAddress])

  const selectedNetwork = useMemo<PayNetworkName | null>(() => {
    if (params.network && allowedNetworkSet.has(params.network as PayNetworkName)) {
      return params.network as PayNetworkName
    }

    if (caipNetwork?.chainNamespace === 'bip122' && allowedNetworkSet.has('bitcoin')) {
      return 'bitcoin'
    }

    if (caipNetwork?.chainNamespace === 'eip155' && currentEvmNetwork && allowedNetworkSet.has(currentEvmNetwork)) {
      return currentEvmNetwork
    }

    return null
  }, [allowedNetworkSet, caipNetwork?.chainNamespace, currentEvmNetwork, params.network])

  const {
    balanceSats: bitcoinBalanceSats,
    balanceBtc: bitcoinBalanceBtc,
    isLoading: isBitcoinBalanceLoading,
    error: bitcoinBalanceError
  } = useBitcoinBalance(selectedNetwork === 'bitcoin', persistedBitcoinAddress)

  const bitcoinTokenBalance = useMemo<TokenBalance>(
    () => ({
      token: 'bitcoin',
      value: bitcoinBalanceSats,
      formatted: bitcoinBalanceBtc,
      decimals: 8,
      isLoading: isBitcoinBalanceLoading,
      error: bitcoinBalanceError
    }),
    [bitcoinBalanceBtc, bitcoinBalanceError, bitcoinBalanceSats, isBitcoinBalanceLoading]
  )

  const tokenBalances = useMemo<TokenBalance[]>(() => {
    if (selectedNetwork === 'bitcoin') {
      return bitcoinBalanceSats > BigInt(0) ? [bitcoinTokenBalance] : []
    }

    if (!selectedNetwork || !currentEvmNetwork || selectedNetwork !== currentEvmNetwork) {
      return []
    }

    return networkTokens
  }, [bitcoinBalanceSats, bitcoinTokenBalance, currentEvmNetwork, networkTokens, selectedNetwork])
  const selectedNetworkChainId = useMemo(() => {
    if (!selectedNetwork || selectedNetwork === 'bitcoin') return null
    return getChainIdForNetwork(selectedNetwork)
  }, [selectedNetwork])
  const nativePriceSymbol = useMemo(() => {
    if (!selectedNetwork) return null
    if (selectedNetwork === 'bitcoin') return 'BTC'
    if (!selectedNetworkChainId) return null
    return getPriceSymbolForChainId(selectedNetworkChainId)
  }, [selectedNetwork, selectedNetworkChainId])
  const requiredUsdValue = useMemo(() => {
    if (requiredPhpValue <= 0) return 0
    if (!phpUsdRate) return null
    return requiredPhpValue * phpUsdRate.rate
  }, [phpUsdRate, requiredPhpValue])
  const getTokenPrice = useCallback(
    (token: Token): number | null => {
      if (token === 'usdc' || token === 'usdt') return 1
      if (token === 'bitcoin') return getBySymbol('BTC')?.price ?? null
      if (token === 'matic' || token === 'pol') return getBySymbol('POL')?.price ?? null
      if (token === 'sepolia') return getBySymbol('ETH')?.price ?? null
      if (token === 'ethereum' && nativePriceSymbol) {
        return getBySymbol(nativePriceSymbol)?.price ?? null
      }
      return getBySymbol('ETH')?.price ?? null
    },
    [getBySymbol, nativePriceSymbol]
  )
  const tokenOptions = useMemo<ProductPaymentTokenOption[]>(
    () =>
      tokenBalances.map((tokenBalance) => {
        const balance = Number.parseFloat(tokenBalance.formatted)
        const unitPrice = getTokenPrice(tokenBalance.token)
        const usdValue = Number.isFinite(balance) && unitPrice != null ? balance * unitPrice : null

        return {
          token: tokenBalance.token,
          balance,
          formattedBalance: tokenBalance.formatted,
          isDisabled: requiredUsdValue == null ? requiredPhpValue > 0 : usdValue == null || usdValue < requiredUsdValue,
          usdValue
        }
      }),
    [getTokenPrice, requiredPhpValue, requiredUsdValue, tokenBalances]
  )
  const selectableTokens = useMemo(
    () => tokenOptions.filter((tokenOption) => !tokenOption.isDisabled).map((tokenOption) => tokenOption.token),
    [tokenOptions]
  )
  const isTokenLoading =
    selectedNetwork === 'bitcoin'
      ? isBitcoinBalanceLoading
      : isNetworkTokensLoading ||
        isCryptoLoading ||
        (requiredPhpValue > 0 && isExchangeRateLoading) ||
        (!!selectedNetwork && currentEvmNetwork !== selectedNetwork)

  const setSelectedToken = useCallback(
    (token: Token | null) => {
      void setParams({ tokenSelected: token ?? null })
    },
    [setParams]
  )

  useEffect(() => {
    if (!selectedNetwork || selectableTokens.length === 0) {
      if (selectedToken !== null) {
        setSelectedToken(null)
      }
      return
    }

    if (!selectedToken || !selectableTokens.includes(selectedToken)) {
      setSelectedToken(selectableTokens[0])
    }
  }, [selectableTokens, selectedNetwork, selectedToken, setSelectedToken])

  const handleNetworkChange = useCallback(
    (network: PayNetworkName) => {
      if (network === 'bitcoin') {
        startTransition(() => {
          void setParams({
            network,
            tokenSelected: null
          })
        })

        void (async () => {
          try {
            await switchAppKitNetwork(bitcoin)
          } catch (error) {
            console.error('Failed to switch AppKit to Bitcoin network', { error })
          }

          if (isBitcoinWalletConnected) return

          try {
            await openAppKit({
              view: 'Connect',
              namespace: 'bip122'
            })
          } catch (error) {
            console.error('Failed to open Bitcoin wallet connect', { error })
          }
        })()

        return
      }

      const targetChainId = getChainIdForNetwork(network)
      const targetAppKitNetwork = EVM_APPKIT_NETWORKS[network as keyof typeof EVM_APPKIT_NETWORKS]

      if (!targetChainId || !targetAppKitNetwork) {
        return
      }

      startTransition(() => {
        void setParams({
          network,
          tokenSelected: selectedToken === 'bitcoin' ? null : selectedToken
        })
      })

      void (async () => {
        try {
          await switchAppKitNetwork(targetAppKitNetwork)
        } catch (error) {
          console.error('Failed to switch AppKit to EVM network', {
            network,
            targetChainId,
            error
          })
        }

        if (!isEvmWalletConnected || !evmWalletAddress) {
          try {
            await openAppKit({
              view: 'Connect',
              namespace: 'eip155'
            })
          } catch (error) {
            console.error('Failed to open EVM wallet connect', { error })
          }
          return
        }

        if (chainId === targetChainId) return

        try {
          await switchChain({ chainId: targetChainId })
        } catch (error) {
          console.error('Failed to switch to EVM network', {
            network,
            targetChainId,
            error
          })
        }
      })()
    },
    [
      chainId,
      evmWalletAddress,
      isBitcoinWalletConnected,
      isEvmWalletConnected,
      openAppKit,
      selectedToken,
      setParams,
      startTransition,
      switchAppKitNetwork,
      switchChain
    ]
  )

  const handleTokenChange = useCallback(
    (token: Token) => {
      setSelectedToken(token)
    },
    [setSelectedToken]
  )

  return {
    exchangeRateError,
    handleNetworkChange,
    handleTokenChange,
    isTokenLoading,
    requiredUsdValue,
    selectedNetwork,
    selectedToken,
    tokenOptions
  }
}
