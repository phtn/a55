import { PaymentSuccess } from '@/components/payment-success'
import { useBitcoinBalance } from '@/hooks/use-bitcoin-balance'
import { useBitcoinTransfer } from '@/hooks/use-bitcoin-transfer'
import { useCrypto } from '@/hooks/use-crypto'
import { useNetworkTokens, type TokenBalance } from '@/hooks/use-network-tokens'
import { usePayButtonState } from '@/hooks/use-pay-button-state'
import { useSend } from '@/hooks/x-use-send'
import { getTransactionExplorerUrl } from '@/lib/explorer'
import { Icon } from '@/lib/icons'
import { getUsdcAddress, isUsdcSupportedChain } from '@/lib/tokens/usdc'
import { getUsdtAddress, isUsdtSupportedChain } from '@/lib/tokens/usdt'
import { cn } from '@/lib/utils'
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react'
import { AnimatePresence, motion } from 'motion/react'
import { Activity, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { parseUnits, type Address } from 'viem'
import { useChainId, useChains, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { AmountPayInput } from './amount-pay'
import { useSearchParams } from './params-ctx'
import { PayAmount } from './pay-amount'
import { PayButtons } from './pay-buttons'
import {
  getNativeSymbolForChainId,
  getNetworkForChainId,
  getPriceSymbolForChainId,
  getTokenFractionDigits,
  isEvmPayToken,
  parseTokenParam,
  type EvmPayToken
} from './pay-config'
import { PaymentProcessing } from './payment-processing'
import { ReceiptModal } from './receipt-modal'
import { tickerSymbol } from './ticker'
import type { Token } from './token-coaster'
import { Tokens } from './token-list'
import { PayTabProps, type PaymentSuccessContext } from './types'

const ERC20_TRANSFER_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  }
] as const

const RECEIPT_RETRY_DELAY_MS = (attemptIndex: number): number => Math.min(1000 * 2 ** attemptIndex, 5000)
const RECEIPT_REFETCH_INTERVAL_MS = (query: { state: { data: unknown } }): number | false => {
  if (query.state.data) return false
  return 2000
}

const getDisplayTokenSymbol = (token: Token | null, nativeSymbol: string): string => {
  if (token === 'ethereum') return nativeSymbol
  if (token === 'usdc' || token === 'usdt' || token === 'bitcoin') return token
  return nativeSymbol
}

const getPaymentAssetSymbol = (token: Token | null, paymentChainId: number | null): string | null => {
  if (!token) return null
  if (token === 'ethereum') {
    if (paymentChainId === null) return tickerSymbol('ethereum')
    return tickerSymbol(getNativeSymbolForChainId(paymentChainId))
  }
  return tickerSymbol(token)
}

const getPaymentChainName = (token: Token | null, paymentChainId: number | null): string | null => {
  if (!token) return null
  if (token === 'bitcoin') return 'bitcoin'
  if (paymentChainId === null) return null
  return getNetworkForChainId(paymentChainId) ?? String(paymentChainId)
}

const BITCOIN_ADDRESS_PATTERN = /^(bc1[ac-hj-np-z02-9]{11,71}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/i

// const EVM_APPKIT_NETWORKS = {
//   ethereum: mainnet,
//   polygon,
//   sepolia,
//   amoy: polygonAmoy
// } as const

const STABLE_TOKEN_CONFIG: Record<
  Exclude<EvmPayToken, 'ethereum'>,
  {
    isSupportedChain: (chainId: number) => boolean
    getAddress: (chainId: number) => Address | undefined
  }
> = {
  usdc: {
    isSupportedChain: isUsdcSupportedChain,
    getAddress: getUsdcAddress
  },
  usdt: {
    isSupportedChain: isUsdtSupportedChain,
    getAddress: getUsdtAddress
  }
}

const toLocalReceipt = (txReceipt: { blockNumber: bigint; status: string } | null | undefined) => {
  if (!txReceipt) return null
  return {
    blockNumber: txReceipt.blockNumber,
    status: txReceipt.status === 'success' ? ('success' as const) : ('reverted' as const)
  }
}

const toUsdCents = (value: number | null | undefined): number | null => {
  if (value == null || !Number.isFinite(value) || value <= 0) return null
  return Math.round(value * 100)
}

export const PayTab = ({
  onPaymentSuccess,
  tokenPrice,
  disabled,
  defaultPaymentAmountUsd,
  defaultRelayAmountUsd,
  orderNumber,
  isPending = false,
  isConfirming = false,
  receipt = null,
  hash = null,
  explorerUrl = null,
  onReset
  // allowedNetworks = DEFAULT_ALLOWED_PAY_NETWORKS
}: PayTabProps) => {
  const { params, setParams } = useSearchParams()

  // Selected token state - sync with search params
  const selectedTokenParam = params.tokenSelected
  const selectedToken = parseTokenParam(selectedTokenParam)
  const setSelectedToken = useCallback(
    (token: Token | null) => {
      void setParams({ tokenSelected: token ?? null })
    },
    [setParams]
  )

  // Payment amount state (always in USD) - sync with search params
  const paymentAmountUsd = params.paymentAmountUsd ?? defaultPaymentAmountUsd ?? '0.00'
  const setPaymentAmountUsd = useCallback(
    (value: string | ((prev: string) => string)) => {
      const newValue = typeof value === 'function' ? value(paymentAmountUsd) : value
      void setParams({ paymentAmountUsd: newValue || null })
    },
    [setParams, paymentAmountUsd]
  )

  // Token used for the last/in-flight payment (so we show correct symbol and use correct tx state)
  const [lastPaymentToken, setLastPaymentToken] = useState<Token | null>(null)
  const [lastPaymentChainId, setLastPaymentChainId] = useState<number | null>(null)
  const [lastPaymentNativeValue, setLastPaymentNativeValue] = useState<number | null>(null)
  const [lastPaymentUsdValue, setLastPaymentUsdValue] = useState<number | null>(null)
  const [lastRelayNativeValue, setLastRelayNativeValue] = useState<number | null>(null)
  const [lastRelayUsdValue, setLastRelayUsdValue] = useState<number | null>(null)

  // const { open: openAppKit } = useAppKit()
  const { address: evmWalletAddress, isConnected: isEvmWalletConnected } = useAppKitAccount({
    namespace: 'eip155'
  })
  const { address: bitcoinWalletAddress, isConnected: isBitcoinWalletConnected } = useAppKitAccount({
    namespace: 'bip122'
  })
  const { caipNetwork } = useAppKitNetwork()
  const chainId = useChainId()
  const chains = useChains()
  // const { mutateAsync } = useSwitchChain()
  const { tokens: networkTokens, isLoading: tokensLoading } = useNetworkTokens()
  const persistedBitcoinAddress = useMemo(() => {
    const candidateAddress = params.walletAddress ?? params.btcAddress
    if (!candidateAddress) return null
    return BITCOIN_ADDRESS_PATTERN.test(candidateAddress) ? candidateAddress : null
  }, [params.walletAddress, params.btcAddress])
  const {
    balanceSats: bitcoinBalanceSats,
    balanceBtc: bitcoinBalanceBtc,
    isLoading: isBitcoinBalanceLoading,
    error: bitcoinBalanceError
  } = useBitcoinBalance(
    params.network === 'bitcoin' || caipNetwork?.chainNamespace === 'bip122',
    persistedBitcoinAddress
  )
  const {
    send: sendBitcoinTransfer,
    isReady: isBitcoinTransferReady,
    isPending: isBitcoinPending,
    isConfirming: isBitcoinConfirming,
    hash: bitcoinHash,
    receipt: bitcoinReceipt
  } = useBitcoinTransfer()
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const { getBySymbol } = useCrypto()

  const currentChain = useMemo(() => chains.find((c) => c.id === chainId), [chains, chainId])

  // Get native token price based on current network
  const nativeTokenPrice = useMemo(() => {
    const priceSymbol = getPriceSymbolForChainId(chainId)
    const quote = getBySymbol(priceSymbol)
    if (quote?.price) {
      return quote.price
    }
    return priceSymbol === 'ETH' ? tokenPrice : null
  }, [chainId, getBySymbol, tokenPrice])

  const bitcoinPrice = useMemo(() => getBySymbol('BTC')?.price ?? null, [getBySymbol])

  // Get token price for displayed token amounts.
  const getTokenPrice = useCallback(
    (token: Token | null): number | null => {
      if (!token) return null
      if (token === 'usdc' || token === 'usdt') return 1 // USDC and USDT are always $1
      if (token === 'ethereum') return nativeTokenPrice // This handles ETH, MATIC, etc. based on network
      if (token === 'matic') return nativeTokenPrice
      if (token === 'bitcoin') return bitcoinPrice
      return null
    },
    [nativeTokenPrice, bitcoinPrice]
  )

  // Base USD value entered by the user before fees
  const baseUsdValue = useMemo(() => {
    if (!paymentAmountUsd) return null
    const parsedAmount = Number.parseFloat(paymentAmountUsd)
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) return null
    return parsedAmount
  }, [paymentAmountUsd])

  // Amount actually charged to the payer (base + 6.75% fee)
  const payableUsdValue = useMemo(() => {
    if (baseUsdValue === null) return null
    return baseUsdValue
  }, [baseUsdValue])

  const relayUsdValue = useMemo(() => {
    if (defaultRelayAmountUsd != null && Number.isFinite(defaultRelayAmountUsd) && defaultRelayAmountUsd > 0) {
      return defaultRelayAmountUsd
    }

    return payableUsdValue
  }, [defaultRelayAmountUsd, payableUsdValue])

  const tokenAmount = useMemo(() => {
    if (!selectedToken || payableUsdValue === null) return null
    const price = getTokenPrice(selectedToken)
    if (!price) return null
    return payableUsdValue / price
  }, [selectedToken, payableUsdValue, getTokenPrice])

  const relayTokenAmount = useMemo(() => {
    if (!selectedToken || relayUsdValue === null) return null
    const price = getTokenPrice(selectedToken)
    if (!price) return null
    return relayUsdValue / price
  }, [selectedToken, relayUsdValue, getTokenPrice])

  // Get current network name from chainId
  const currentNetwork = useMemo(() => getNetworkForChainId(chainId), [chainId])
  const isAppKitBitcoinNetwork = caipNetwork?.chainNamespace === 'bip122'
  const selectedNetwork = useMemo(() => {
    if (isAppKitBitcoinNetwork) return 'bitcoin'
    if (caipNetwork?.chainNamespace === 'eip155') return currentNetwork
    if (isBitcoinWalletConnected && !isEvmWalletConnected) return 'bitcoin'
    if (isEvmWalletConnected && currentNetwork) return currentNetwork
    return params.network ?? currentNetwork
  }, [
    caipNetwork?.chainNamespace,
    currentNetwork,
    isAppKitBitcoinNetwork,
    isBitcoinWalletConnected,
    isEvmWalletConnected,
    params.network
  ])
  const isBitcoinNetworkSelected = selectedNetwork === 'bitcoin'
  const selectedWalletAddress = useMemo(() => {
    if (selectedNetwork === 'bitcoin') {
      return bitcoinWalletAddress ?? persistedBitcoinAddress ?? null
    }

    return evmWalletAddress ?? null
  }, [selectedNetwork, bitcoinWalletAddress, persistedBitcoinAddress, evmWalletAddress])

  // const selectorCurrentNetwork = useMemo(() => {
  //   if (!selectedNetwork) return null
  //   return allowedNetworks.includes(selectedNetwork as PayNetworkName) ? selectedNetwork : null
  // }, [allowedNetworks, selectedNetwork])

  useEffect(() => {
    if (!selectedNetwork) return
    if (params.network === selectedNetwork) return
    void setParams({ network: selectedNetwork })
  }, [selectedNetwork, params.network, setParams])

  useEffect(() => {
    if (params.walletAddress === selectedWalletAddress && params.btcAddress === null) {
      return
    }

    void setParams({
      walletAddress: selectedWalletAddress,
      // Cleanup legacy param once walletAddress is in place.
      btcAddress: null
    })
  }, [selectedWalletAddress, params.walletAddress, params.btcAddress, setParams])

  // Handle network selection
  // const handleNetworkSelect = useCallback(
  //   (network: string) => () => {
  //     if (network === 'bitcoin') {
  //       startTransition(() => {
  //         void setParams({ network, tokenSelected: 'bitcoin' })
  //       })
  //       void (async () => {
  //         try {
  //           await switchAppKitNetwork(bitcoin)
  //         } catch (error) {
  //           console.error('Failed to switch to Bitcoin network', { error })
  //         }

  //         if (isBitcoinWalletConnected) return

  //         try {
  //           await openAppKit({
  //             view: 'Connect',
  //             namespace: 'bip122'
  //           })
  //         } catch (error) {
  //           console.error('Failed to open Bitcoin wallet connect', { error })
  //         }
  //       })()
  //       return
  //     }
  //     const targetChainId = getChainIdForNetwork(network)
  //     if (!targetChainId) return
  //     const targetAppKitNetwork = EVM_APPKIT_NETWORKS[network as keyof typeof EVM_APPKIT_NETWORKS]
  //     if (!targetAppKitNetwork) return

  //     startTransition(() => {
  //       void setParams({
  //         network,
  //         tokenSelected: selectedToken === 'bitcoin' ? null : selectedToken
  //       })
  //     })

  //     void (async () => {
  //       try {
  //         await switchAppKitNetwork(targetAppKitNetwork)
  //       } catch (error) {
  //         console.error('Failed to switch AppKit to EVM network', {
  //           network,
  //           targetChainId,
  //           error
  //         })
  //       }

  //       if (!isEvmWalletConnected) {
  //         try {
  //           await openAppKit({
  //             view: 'Connect',
  //             namespace: 'eip155'
  //           })
  //         } catch (error) {
  //           console.error('Failed to open EVM wallet connect', { error })
  //         }
  //         return
  //       }

  //       if (chainId === targetChainId) return

  //       try {
  //         await mutateAsync({ chainId: targetChainId })
  //       } catch (error) {
  //         console.error('Failed to switch to EVM network', {
  //           network,
  //           targetChainId,
  //           error
  //         })
  //       }
  //     })()
  //   },
  //   [
  //     chainId,
  //     isEvmWalletConnected,
  //     isBitcoinWalletConnected,
  //     mutateAsync,
  //     openAppKit,
  //     selectedToken,
  //     startTransition,
  //     setParams,
  //     switchAppKitNetwork
  //   ]
  // )

  useEffect(() => {
    if (isBitcoinNetworkSelected) {
      if (selectedToken !== 'bitcoin') {
        setSelectedToken('bitcoin')
      }
      return
    }

    if (selectedToken === 'bitcoin') {
      setSelectedToken(null)
    }
  }, [isBitcoinNetworkSelected, selectedToken, setSelectedToken])

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
    if (isBitcoinNetworkSelected) {
      return [bitcoinTokenBalance]
    }
    return networkTokens
  }, [bitcoinTokenBalance, isBitcoinNetworkSelected, networkTokens])

  // Extract token list from network tokens
  const availableTokens = useMemo<Token[]>(() => {
    return tokenBalances.map((tokenBalance) => tokenBalance.token)
  }, [tokenBalances])

  // Get selected token balance
  const selectedTokenBalance = useMemo(() => {
    if (!selectedToken) return null
    return tokenBalances.find((token) => token.token === selectedToken) ?? null
  }, [selectedToken, tokenBalances])

  // Check if selected token has insufficient balance
  const hasInsufficientBalance = useMemo(() => {
    if (!selectedTokenBalance || !tokenAmount) return false
    const balance = Number.parseFloat(selectedTokenBalance.formatted)
    return tokenAmount > balance
  }, [selectedTokenBalance, tokenAmount])

  // Handle token selection
  const handleTokenSelect = useCallback(
    (token: Token) => {
      setSelectedToken(token)
    },
    [setSelectedToken]
  )

  // Formatted token amount for processing state (selected token)
  const processingTokenAmountFormatted = useMemo(() => {
    if (tokenAmount == null) return ''
    return tokenAmount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: getTokenFractionDigits(selectedToken)
    })
  }, [tokenAmount, selectedToken])

  const nativeSymbol = getNativeSymbolForChainId(chainId)
  const displayTokenSymbol = (t: Token | null) => getDisplayTokenSymbol(t, nativeSymbol)

  // For success/receipt: use the tracked values from the latest payment attempt
  const successTokenAmountFormatted = useMemo(() => {
    if (lastPaymentNativeValue === null) return ''
    return lastPaymentNativeValue.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: getTokenFractionDigits(lastPaymentToken)
    })
  }, [lastPaymentNativeValue, lastPaymentToken])

  const successPaymentChainId = lastPaymentToken === 'bitcoin' ? null : lastPaymentChainId
  const successTokenSymbol =
    getPaymentAssetSymbol(lastPaymentToken, successPaymentChainId) ??
    getDisplayTokenSymbol(lastPaymentToken, nativeSymbol)

  // Get payment destination from environment variable
  const evmRelaySource = useMemo(() => {
    const dest = process.env.NEXT_PUBLIC_SRC_E
    if (!dest) {
      console.error('EVM Native is not set')
      return null
    }
    return dest as Address
  }, [])

  const bitcoinRelaySource = useMemo(() => {
    const configuredSource = process.env.NEXT_PUBLIC_SRC_BTC
    if (!configuredSource) return null
    return BITCOIN_ADDRESS_PATTERN.test(configuredSource) ? configuredSource : null
  }, [])

  useEffect(() => {
    if (!isBitcoinNetworkSelected) return
    if (bitcoinRelaySource) return
    console.warn('BTC Native Source is missing or invalid. Bitcoin payments are disabled.')
  }, [bitcoinRelaySource, isBitcoinNetworkSelected])

  const paymentDestination = isBitcoinNetworkSelected ? bitcoinRelaySource : evmRelaySource

  // EIP-681 payment request URI for wallet QR scan (ethereum:...)
  const paymentRequestUri = useMemo(() => {
    if (!selectedToken) return null

    if (selectedToken === 'bitcoin') {
      if (!bitcoinRelaySource) return null
      if (tokenAmount == null || tokenAmount <= 0) return null
      const amount = tokenAmount.toFixed(8)
      return `bitcoin:${bitcoinRelaySource}?amount=${amount}`
    }

    if (!evmRelaySource || !chainId) return null
    if (selectedToken === 'ethereum') {
      if (tokenAmount == null || tokenAmount <= 0) return null
      const value = `${Number(tokenAmount)}e18`
      return `ethereum:${evmRelaySource}@${chainId}?value=${value}`
    }

    if (selectedToken === 'usdc' || selectedToken === 'usdt') {
      const tokenConfig = STABLE_TOKEN_CONFIG[selectedToken]
      if (!tokenConfig.isSupportedChain(chainId) || payableUsdValue === null) {
        return null
      }

      const tokenAddress = tokenConfig.getAddress(chainId)
      if (!tokenAddress) return null

      const amount = `${payableUsdValue.toFixed(6)}e6`
      return `ethereum:${tokenAddress}@${chainId}/transfer?address=${evmRelaySource}&uint256=${amount}`
    }

    return null
  }, [bitcoinRelaySource, chainId, evmRelaySource, selectedToken, tokenAmount, payableUsdValue])

  // Hook for sending transactions
  const {
    send: sendEth,
    isPending: isEthPending,
    isConfirming: isEthConfirming,
    hash: ethHash,
    receipt: ethReceipt
  } = useSend()

  // Hook for writing contracts (USDC and USDT transfers)
  const { mutate, data: usdcHash, isPending: isUsdcPending } = useWriteContract()
  const { mutate: mutateUsdt, data: usdtHash, isPending: isUsdtPending } = useWriteContract()

  // Wait for USDC transaction receipt
  const { isLoading: isUsdcConfirming, data: usdcReceipt } = useWaitForTransactionReceipt({
    hash: usdcHash,
    query: {
      enabled: !!usdcHash,
      retry: 5,
      retryDelay: RECEIPT_RETRY_DELAY_MS,
      refetchInterval: RECEIPT_REFETCH_INTERVAL_MS
    }
  })

  // Wait for USDT transaction receipt
  const { isLoading: isUsdtConfirming, data: usdtReceipt } = useWaitForTransactionReceipt({
    hash: usdtHash,
    query: {
      enabled: !!usdtHash,
      retry: 5,
      retryDelay: RECEIPT_RETRY_DELAY_MS,
      refetchInterval: RECEIPT_REFETCH_INTERVAL_MS
    }
  })

  // Use lastPaymentToken to resolve tx state (token we actually paid with), fallback to selectedToken
  const tokenForTxState = lastPaymentToken ?? selectedToken

  const localTxStateByToken = useMemo<
    Partial<
      Record<
        Token,
        {
          isPending: boolean
          isConfirming: boolean
          hash: `0x${string}` | null | undefined
          receipt: { blockNumber: bigint; status: 'success' | 'reverted' } | null
        }
      >
    >
  >(
    () => ({
      bitcoin: {
        isPending: isBitcoinPending,
        isConfirming: isBitcoinConfirming,
        hash: bitcoinHash,
        receipt: bitcoinReceipt
      },
      ethereum: {
        isPending: isEthPending,
        isConfirming: isEthConfirming,
        hash: ethHash,
        receipt: toLocalReceipt(ethReceipt)
      },
      usdc: {
        isPending: isUsdcPending,
        isConfirming: isUsdcConfirming,
        hash: usdcHash,
        receipt: toLocalReceipt(usdcReceipt)
      },
      usdt: {
        isPending: isUsdtPending,
        isConfirming: isUsdtConfirming,
        hash: usdtHash,
        receipt: toLocalReceipt(usdtReceipt)
      }
    }),
    [
      isBitcoinPending,
      isBitcoinConfirming,
      bitcoinHash,
      bitcoinReceipt,
      isEthPending,
      isEthConfirming,
      ethHash,
      ethReceipt,
      isUsdcPending,
      isUsdcConfirming,
      usdcHash,
      usdcReceipt,
      isUsdtPending,
      isUsdtConfirming,
      usdtHash,
      usdtReceipt
    ]
  )

  const localTxState = tokenForTxState ? (localTxStateByToken[tokenForTxState] ?? null) : null

  // Use local transaction state if we have an active transaction, otherwise use props
  const localIsPending = localTxState?.isPending ?? false
  const localIsConfirming = localTxState?.isConfirming ?? false
  const localHash = localTxState?.hash ?? null
  const localReceipt = localTxState?.receipt ?? null

  const activeIsPending = localIsPending || isPending
  const activeIsConfirming = localIsConfirming || isConfirming
  const activeHash = localHash || hash
  const activeReceipt = localReceipt || receipt
  const paymentSuccessContext = useMemo<PaymentSuccessContext | undefined>(() => {
    if (!tokenForTxState) return undefined

    const paymentChainId = tokenForTxState === 'bitcoin' ? null : (lastPaymentChainId ?? chainId)
    const asset = getPaymentAssetSymbol(tokenForTxState, paymentChainId)
    const chain = getPaymentChainName(tokenForTxState, paymentChainId)
    const nativeValue = lastRelayNativeValue
    const usdValue = lastRelayUsdValue

    if (!asset || !chain || nativeValue === null || usdValue === null) {
      return undefined
    }

    return {
      asset,
      chain,
      nativeValue,
      usdValue
    }
  }, [tokenForTxState, lastPaymentChainId, chainId, lastRelayNativeValue, lastRelayUsdValue])
  const reportedSuccessHashRef = useRef<`0x${string}` | null>(null)
  const relayedPaymentHashRef = useRef<`0x${string}` | null>(null)

  useEffect(() => {
    if (!onPaymentSuccess || !activeHash || !activeReceipt || activeReceipt.status !== 'success') {
      return
    }

    if (reportedSuccessHashRef.current === activeHash) {
      return
    }

    reportedSuccessHashRef.current = activeHash
    void onPaymentSuccess(activeHash, paymentSuccessContext)
  }, [activeHash, activeReceipt, onPaymentSuccess, paymentSuccessContext])

  useEffect(() => {
    if (!activeHash || !activeReceipt || activeReceipt.status !== 'success') {
      return
    }

    if (!tokenForTxState) {
      return
    }

    if (relayedPaymentHashRef.current === activeHash) {
      return
    }

    relayedPaymentHashRef.current = activeHash

    void (async () => {
      try {
        const response = isEvmPayToken(tokenForTxState)
          ? await fetch('/api/relay', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                paymentHash: activeHash,
                chainId: lastPaymentChainId ?? chainId,
                token: tokenForTxState,
                paymentUsdCents: toUsdCents(lastPaymentUsdValue),
                relayUsdCents: toUsdCents(lastRelayUsdValue)
              })
            })
          : tokenForTxState === 'bitcoin'
            ? await fetch('/api/relay/bitcoin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  paymentHash: activeHash,
                  paymentUsdCents: toUsdCents(lastPaymentUsdValue),
                  relayUsdCents: toUsdCents(lastRelayUsdValue)
                })
              })
            : null

        if (!response) {
          return
        }

        if (!response.ok) {
          const payload = await response.json().catch(() => null)
          throw new Error(payload?.error ?? 'Relay request failed')
        }

        if (process.env.NODE_ENV === 'development') {
          const payload = await response.json().catch(() => null)
          console.log('Relay completed:', payload)
        }
      } catch (relayError) {
        relayedPaymentHashRef.current = null
        console.error('Relay forwarding failed:', relayError)
      }
    })()
  }, [activeHash, activeReceipt, tokenForTxState, lastPaymentChainId, chainId, lastPaymentUsdValue, lastRelayUsdValue])

  const receiptExplorerUrl = useMemo(
    () =>
      tokenForTxState === 'bitcoin' && activeHash
        ? `https://mempool.space/tx/${activeHash.replace(/^0x/, '')}`
        : (getTransactionExplorerUrl(currentChain, activeHash) ?? explorerUrl),
    [currentChain, activeHash, explorerUrl, tokenForTxState]
  )

  const isUnsupportedPaymentToken =
    selectedToken !== null && selectedToken !== 'bitcoin' && !isEvmPayToken(selectedToken)
  const isUnsupportedPaymentNetwork = isBitcoinNetworkSelected && !isBitcoinTransferReady
  const isMissingBitcoinDestination = isBitcoinNetworkSelected && !bitcoinRelaySource

  const isBasePayDisabled = usePayButtonState({
    disabled,
    activeIsConfirming,
    activeIsPending,
    hasInsufficientBalance,
    selectedToken,
    paymentAmountUsd,
    dtest: paymentDestination,
    localIsPending,
    localIsConfirming,
    isPendingProp: isPending,
    isConfirmingProp: isConfirming
  })
  const isRelayTargetAbovePayment =
    relayUsdValue !== null && payableUsdValue !== null && relayUsdValue > payableUsdValue
  const isPayDisabled =
    isBasePayDisabled ||
    isUnsupportedPaymentToken ||
    isUnsupportedPaymentNetwork ||
    isMissingBitcoinDestination ||
    isRelayTargetAbovePayment

  const sendStableTokenPayment = useCallback(
    (token: Exclude<EvmPayToken, 'ethereum'>, usdAmount: number) => {
      if (!evmRelaySource) return

      const tokenConfig = STABLE_TOKEN_CONFIG[token]
      if (!tokenConfig.isSupportedChain(chainId)) {
        throw new Error(`${token.toUpperCase()} is not supported on this chain`)
      }

      const tokenAddress = tokenConfig.getAddress(chainId)
      if (!tokenAddress) {
        throw new Error(`${token.toUpperCase()} address not found for this chain`)
      }

      const transferAmount = parseUnits(usdAmount.toFixed(6), 6)
      const writer = token === 'usdc' ? mutate : mutateUsdt
      writer({
        abi: ERC20_TRANSFER_ABI,
        address: tokenAddress,
        functionName: 'transfer',
        args: [evmRelaySource, transferAmount]
      })
    },
    [chainId, evmRelaySource, mutate, mutateUsdt]
  )

  const sendBitcoinPayment = useCallback(
    async (btcAmount: number) => {
      if (!bitcoinRelaySource) {
        throw new Error('BTC Relay source is missing or invalid for Bitcoin payments')
      }

      const satoshis = parseUnits(btcAmount.toFixed(8), 8)
      if (satoshis <= BigInt(0)) {
        throw new Error('Bitcoin payment amount must be greater than zero')
      }

      await sendBitcoinTransfer({
        recipient: bitcoinRelaySource,
        amountSats: satoshis
      })
    },
    [bitcoinRelaySource, sendBitcoinTransfer]
  )

  // Handle payment
  const handlePay = useCallback(async () => {
    if (!selectedToken || !paymentAmountUsd || !paymentDestination || hasInsufficientBalance) {
      return
    }

    if (payableUsdValue === null) {
      return
    }

    if (relayUsdValue === null || relayUsdValue > payableUsdValue) {
      return
    }

    setLastPaymentToken(selectedToken)
    setLastPaymentChainId(chainId)
    setLastPaymentNativeValue(tokenAmount)
    setLastPaymentUsdValue(payableUsdValue)
    setLastRelayNativeValue(relayTokenAmount ?? tokenAmount)
    setLastRelayUsdValue(relayUsdValue)

    try {
      switch (selectedToken) {
        case 'bitcoin':
          if (tokenAmount == null) return
          setLastPaymentChainId(null)
          await sendBitcoinPayment(tokenAmount)
          return
        case 'ethereum':
          if (!evmRelaySource) return
          sendEth({ to: evmRelaySource, usd: payableUsdValue, chainId })
          return
        case 'usdc':
        case 'usdt':
          sendStableTokenPayment(selectedToken, payableUsdValue)
          return
        default:
          console.warn('Selected token is not supported yet for payments', {
            token: selectedToken
          })
      }
    } catch (error) {
      console.error('Payment error:', error)
      // Error will be handled by the hooks
    }
  }, [
    selectedToken,
    paymentAmountUsd,
    payableUsdValue,
    relayUsdValue,
    evmRelaySource,
    paymentDestination,
    hasInsufficientBalance,
    tokenAmount,
    relayTokenAmount,
    chainId,
    sendBitcoinPayment,
    sendEth,
    sendStableTokenPayment
  ])

  const spinRandomAmount = useCallback(() => {
    // range only from 1 to 12
    const randomAmount = Math.abs(Math.random() * 120)
    setPaymentAmountUsd(
      randomAmount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        signDisplay: 'never'
      })
    )
  }, [setPaymentAmountUsd])

  const payButtonTokenLabel = selectedToken ? tickerSymbol(displayTokenSymbol(selectedToken)) : null
  const payButtonLabel = payButtonTokenLabel ? `Pay with ${payButtonTokenLabel}` : 'Pay'
  const enablePayHoverStyles =
    !disabled &&
    !activeIsConfirming &&
    !activeIsPending &&
    !hasInsufficientBalance &&
    !isUnsupportedPaymentToken &&
    !isUnsupportedPaymentNetwork &&
    !isMissingBitcoinDestination &&
    !isRelayTargetAbovePayment &&
    !!selectedToken &&
    !!paymentAmountUsd &&
    !!paymentDestination
  const showProcessingState = activeIsPending || activeIsConfirming

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ layout: { duration: 0.3, ease: 'easeInOut' } }}
      className='space-y-0 w-full p-1 md:p-4 md:h-160 flex flex-col'>
      <div>
        {paymentAmountUsd && payableUsdValue !== null && !activeReceipt && (
          <PayAmount
            spinRandomAmount={spinRandomAmount}
            usdValue={payableUsdValue}
            paymentRequestUri={paymentRequestUri}
            recipient={paymentDestination}
            tokenAmountFormatted={processingTokenAmountFormatted}
            symbol={displayTokenSymbol(selectedToken)}
          />
        )}
        {selectedToken && (
          <AmountPayInput
            selectedTokenBalance={selectedTokenBalance}
            tokenAmount={tokenAmount}
            selectedToken={selectedToken}
            paymentAmountUsd={paymentAmountUsd}
            setPaymentAmountUsd={setPaymentAmountUsd}
            getTokenPrice={getTokenPrice}
          />
        )}

        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ layout: { duration: 0.3, ease: 'easeInOut' } }}
          className='space-y-6 md:px-4 transition-transform duration-200'>
          <div className='px-2 font-display font-base flex items-center justify-between capitalize'>
            <span>Your Tokens</span>
            <div className='flex items-center space-x-2'>
              <span className='opacity-70'>network</span>
              <span className='font-medium px-2 capitalize'>{currentNetwork}</span>
            </div>
          </div>
          <motion.div
            layout
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className={cn('overflow-y-auto', {
              'h-28': availableTokens.length <= 1,
              'h-56': availableTokens.length > 1
            })}>
            {(isBitcoinNetworkSelected ? isBitcoinBalanceLoading : tokensLoading) ? (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className='flex items-center justify-center h-24'>
                <Icon name='spinner-ring' className='w-6 h-6 text-white/40' />
              </motion.div>
            ) : availableTokens.length > 0 ? (
              <Tokens
                tokens={availableTokens}
                tokenBalances={tokenBalances}
                selectedToken={selectedToken}
                paymentAmountUsd={paymentAmountUsd}
                tokenPrices={{
                  usdc: 1,
                  usdt: 1,
                  ethereum: nativeTokenPrice,
                  bitcoin: bitcoinPrice
                }}
                nativeSymbol={nativeSymbol}
                listHeightClassName='h-54'
                onTokenSelect={handleTokenSelect}
              />
            ) : (
              <div className='relative h-24 overflow-hidden flex items-center justify-center text-foreground/60 text-sm'>
                <motion.div className='space-y-3 sm:space-y-4 opacity-60 bg-blend-lighten blur-3xl w-full h-full absolute -top-1 right-0 bg-top-right' />
                <p className=' line-clamp-2 max-w-[18ch] text-center font-okxs'>
                  No tokens with balance found on this network
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>

        <AnimatePresence mode='wait'>
          <motion.div layout className='mt-0'>
            {showProcessingState ? (
              <PaymentProcessing
                key='sending'
                tokenAmount={processingTokenAmountFormatted}
                tokenSymbol={displayTokenSymbol(selectedToken)}
                usdValue={payableUsdValue}
              />
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      <Activity mode={showProcessingState ? 'hidden' : 'visible'}>
        <div className='mt-auto pb-6'>
          <PayButtons
            showReceiptButton={!!activeReceipt && activeReceipt.status === 'success' && !!onReset}
            onViewReceipt={() => setShowReceiptModal(true)}
            onPay={handlePay}
            isPayDisabled={isPayDisabled}
            isPayProcessing={showProcessingState}
            payLabel={payButtonLabel}
            enablePayHoverStyles={enablePayHoverStyles}
            payToken={selectedToken}
            nativeSymbol={nativeSymbol}
          />
        </div>
      </Activity>
      <Activity mode={onPaymentSuccess ? 'visible' : 'hidden'}>
        <PaymentSuccess orderNumber={orderNumber} transactionId={hash} />
      </Activity>
      <ReceiptModal
        open={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        amount={successTokenAmountFormatted}
        symbol={successTokenSymbol}
        usdValue={lastPaymentUsdValue}
        hash={activeHash ?? null}
        explorerUrl={receiptExplorerUrl}
        recipient={null}
        blockNumber={activeReceipt?.blockNumber}
        timestamp={new Date().toISOString()}
      />
    </motion.div>
  )
}
