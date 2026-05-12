import { useSearchParams } from './params-ctx'
import { config } from '@/ctx/wagmi/config'
import { useSend } from '@/hooks/x-use-send'
import { getTransactionExplorerUrl } from '@/lib/explorer'
import { cn } from '@/lib/utils'
import { useAppKitAccount } from '@reown/appkit/react'
import { getBalance } from '@wagmi/core'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useId, useMemo, useRef, useState, useTransition } from 'react'
import { formatUnits, isAddress } from 'viem'
import { useChainId, useChains } from 'wagmi'
import { GlowDivider } from './components'
import { PayTab } from './pay'
import { SendTab } from './send'
import { SwapTab } from './swap'

const tabs = [
  { id: 'pay', label: 'pay', icon: 'icon' },
  { id: 'swap', label: 'convert', icon: 'arrow-down' },
  { id: 'send', label: 'send', icon: 'icon' }
]

export const CryptoWidget = () => {
  const { params, setParams } = useSearchParams()
  const activeTab = params.tabId ?? 'pay'

  const setActiveTab = useCallback(
    (tab: string) => {
      void setParams({ tabId: tab })
    },
    [setParams]
  )

  const { send, isPending, isConfirming, hash, receipt, ethPrice } = useSend()
  const { address } = useAppKitAccount({ namespace: 'eip155' })
  const evmAddress = useMemo(() => {
    if (!address) return undefined
    return isAddress(address) ? address : undefined
  }, [address])

  // Use search params for to and amount
  const to = params.to ?? ''
  const amount = params.amount ?? ''

  const setTo = useCallback(
    (value: string | ((prev: string) => string)) => {
      const newValue = typeof value === 'function' ? value(to) : value
      void setParams({ to: newValue || null })
    },
    [setParams, to]
  )

  const setAmount = useCallback(
    (value: string | ((prev: string) => string)) => {
      const newValue = typeof value === 'function' ? value(amount) : value
      void setParams({ amount: newValue || null })
    },
    [setParams, amount]
  )

  const [sendTabKey, setSendTabKey] = useState(0)
  const [showPreview, setShowPreview] = useState(false)
  const [_localError, setLocalError] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const [balance, setBalance] = useState<{ value: bigint; symbol: string; decimals: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const amountInputRef = useRef<HTMLInputElement>(null)

  const chainId = useChainId()
  const chains = useChains()
  const currentChain = useMemo(() => chains.find((chain) => chain.id === chainId), [chains, chainId])

  // Get block explorer URL for transaction hash (linkable)
  const explorerUrl = useMemo(() => getTransactionExplorerUrl(currentChain, hash), [currentChain, hash])

  // Validate address
  const isValidAddress = useMemo(() => {
    if (!to) return false
    return isAddress(to)
  }, [to])

  // Calculate USD value from token amount
  const usdValue = useMemo(() => {
    if (!amount || !ethPrice || !balance) return null
    const tokenAmount = Number.parseFloat(amount)
    if (Number.isNaN(tokenAmount) || tokenAmount <= 0) return null
    return tokenAmount * ethPrice
  }, [amount, ethPrice, balance])

  // Validate form
  const isFormValid = useMemo(() => {
    if (!isValidAddress || !amount) return false
    const tokenAmount = Number.parseFloat(amount)
    return !Number.isNaN(tokenAmount) && tokenAmount > 0
  }, [isValidAddress, amount])

  // Check if user has sufficient balance
  const hasInsufficientBalance = useMemo(() => {
    if (!balance || !amount) return false
    const tokenAmount = Number.parseFloat(amount)
    if (Number.isNaN(tokenAmount)) return false
    const balanceEth = Number.parseFloat(formatUnits(balance.value, balance.decimals))
    return tokenAmount > balanceEth
  }, [balance, amount])

  // Format balance
  const formattedBalance = useMemo(() => {
    if (!balance) return null
    return Number.parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(8)
  }, [balance])

  const handleSend = useCallback(() => {
    if (!isValidAddress) {
      return
    }

    const tokenAmount = Number.parseFloat(amount)
    if (Number.isNaN(tokenAmount) || tokenAmount <= 0) {
      return
    }

    if (hasInsufficientBalance) {
      return
    }

    setShowPreview(true)
  }, [amount, isValidAddress, hasInsufficientBalance])

  const confirmSend = useCallback(() => {
    if (!ethPrice || !amount) {
      setLocalError('Unable to convert amount: ETH price not available')
      setShowPreview(false)
      return
    }

    const tokenAmount = Number.parseFloat(amount)
    if (Number.isNaN(tokenAmount) || tokenAmount <= 0) {
      setLocalError('Please enter a valid amount greater than 0')
      setShowPreview(false)
      return
    }

    // Convert token amount to USD
    const usdAmount = tokenAmount * ethPrice

    try {
      send({ to: to as `0x${string}`, usd: usdAmount })
      setShowPreview(false)
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to send transaction')
      setShowPreview(false)
    }
  }, [send, to, amount, ethPrice])

  // Fetch balance when address or chainId changes
  useEffect(() => {
    let isMounted = true

    if (evmAddress && chainId) {
      getBalance(config, {
        address: evmAddress,
        chainId
      })
        .then((bal) => {
          if (isMounted) {
            startTransition(() => {
              setBalance({
                value: bal.value,
                symbol: bal.symbol,
                decimals: bal.decimals
              })
            })
          }
        })
        .catch((err) => {
          console.error('Failed to fetch balance:', err)
          if (isMounted) {
            startTransition(() => {
              setBalance(null)
            })
          }
        })
    } else {
      if (isMounted) {
        startTransition(() => {
          setBalance(null)
        })
      }
    }

    return () => {
      isMounted = false
    }
  }, [evmAddress, chainId, startTransition])

  // Set timeout for confirmation - if RPC is slow, stop showing loading after 30 seconds
  useEffect(() => {
    if (hash && isConfirming) {
      const timeout = setTimeout(() => {
        // Timeout reached - could show a message or handle differently
        console.log('Transaction confirmation timeout')
      }, 30000) // 30 seconds timeout
      return () => clearTimeout(timeout)
    }
  }, [hash, isConfirming])

  // Show success animation and refetch balance when transaction is confirmed
  useEffect(() => {
    if (receipt && receipt.status === 'success') {
      let isMounted = true

      // Refetch balance after successful transaction
      if (evmAddress && chainId) {
        getBalance(config, {
          address: evmAddress,
          chainId
        })
          .then((bal) => {
            if (isMounted) {
              startTransition(() => {
                setBalance({
                  value: bal.value,
                  symbol: bal.symbol,
                  decimals: bal.decimals
                })
              })
            }
          })
          .catch((err) => {
            if (isMounted) {
              console.error('Failed to refetch balance after transaction:', err)
            }
          })
      }

      return () => {
        isMounted = false
      }
    }
    // Always return cleanup function, even when condition is false
    return () => {
      // No-op cleanup when condition is false
    }
  }, [receipt, evmAddress, chainId, startTransition])

  // Reset form after successful transaction
  const handleReset = useCallback(() => {
    void setParams({ to: null, amount: null })
    setLocalError(null)
    setShowPreview(false)
    // Force remount by changing key
    setSendTabKey((prev) => prev + 1)
  }, [setParams])

  const id = useId()

  return (
    <div className='relative w-full max-w-md mx-auto'>
      {/* Main Widget Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='relative bg-linear-to-br from-zinc-900 via-zinc-950 to-zinc-950 md:border-[0.33px] border-white/10 overflow-hidden shadow-2xl'>
        {/* Header */}
        <div className='relative md:pt-0 pt-12 pb-0'>
          {/*<NetworkHeader chain={currentChain} address={address} />*/}

          {/* Tab Navigation */}
          <div className='relative z-200 flex md:py-1 border-b-[0.33px] border-dotted border-black/10'>
            {/* Active Tab Indicator */}
            <motion.div
              className={cn(
                'absolute top-0 bottom-0 border-b-[0.33px] border-white/0 bg-linear-to-r from-black/0 to-black/0',
                {
                  '': activeTab === '1'
                }
              )}
              style={{ width: `calc(${100 / 3}% - 4px)` }}
              animate={{
                left: `calc(${tabs.findIndex((t) => t.id === activeTab) * (100 / 3)}% + 2px)`
              }}
              transition={{ type: 'spring', stiffness: 250, damping: 30 }}
            />

            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', damping: 80, stiffness: 50 }}
                  className={cn(
                    'outline-none relative h-10 gap-3 z-10',
                    'text-slate-200/50 flex-1 flex items-center justify-center',
                    { 'text-white outline-1 focus-within:outline-1': isActive, '': activeTab === 'pay' }
                  )}>
                  <span className='font-okxs font-medium text-xs capitalize'>{tab.label}</span>
                </motion.button>
              )
            })}
          </div>
        </div>
        <GlowDivider position={params.tabId === 'pay' ? 'left' : params.tabId === 'send' ? 'right' : 'center'} />

        <div className='md:p-0 min-h-105'>
          <AnimatePresence mode='wait'>
            {activeTab === 'pay' && (
              <PayTab
                onSend={handleSend}
                addressInputRef={inputRef}
                amountInputRef={amountInputRef}
                disabled={isPending || isConfirming || hasInsufficientBalance}
                setTo={setTo}
                setAmount={setAmount}
                amount={amount}
                formattedBalance={formattedBalance}
                balance={balance}
                tokenPrice={ethPrice}
                isPending={isPending}
                isConfirming={isConfirming}
                receipt={receipt}
                hash={hash}
                explorerUrl={explorerUrl}
                onReset={handleReset}
                key={`pay-${id}`}
              />
            )}
            {activeTab === 'swap' && <SwapTab key='swap' />}
            {activeTab === 'send' && (
              <SendTab
                onSend={handleSend}
                addressInputRef={inputRef}
                amountInputRef={amountInputRef}
                disabled={isPending || isConfirming || !isValidAddress || hasInsufficientBalance || !isFormValid}
                setTo={setTo}
                setAmount={setAmount}
                to={to}
                amount={amount}
                formattedBalance={formattedBalance}
                balance={balance}
                tokenPrice={ethPrice}
                isPending={isPending}
                isConfirming={isConfirming}
                receipt={receipt}
                hash={hash}
                explorerUrl={explorerUrl}
                onReset={handleReset}
                key={`send-${sendTabKey}`}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm'
            onClick={() => setShowPreview(false)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className='w-full max-w-md rounded-2xl bg-linear-to-br from-stone-900 via-stone-950 to-zinc-950 border border-white/10 p-6 shadow-2xl'>
              <h3 className='text-xl font-bold mb-4 text-white'>Confirm Transaction</h3>
              <div className='space-y-4 mb-6'>
                <div>
                  <p className='text-sm text-white/60 mb-1'>To</p>
                  <p className='text-sm font-mono text-white break-all'>{to}</p>
                </div>
                <div>
                  <p className='text-sm text-white/60 mb-1'>Amount</p>
                  <p className='text-lg font-bold text-white'>
                    {amount} {balance?.symbol ?? 'ETH'}
                  </p>
                  {usdValue && <p className='text-sm text-white/50'>≈ ${usdValue.toFixed(2)} USD</p>}
                </div>
              </div>
              <div className='flex gap-3'>
                <button
                  onClick={() => setShowPreview(false)}
                  className='flex-1 px-4 py-2 rounded-lg border border-white/20 text-white/80 hover:bg-white/10 transition-colors'>
                  Cancel
                </button>
                <button
                  onClick={confirmSend}
                  disabled={isPending}
                  className='flex-1 px-4 py-2 rounded-lg bg-linear-to-r from-slate-400 via-rose-300 to-rose-400 hover:from-slate-200 hover:to-rose-300 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed'>
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
