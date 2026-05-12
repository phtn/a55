import { useNetworkTokens } from '@/hooks/use-network-tokens'
import { usePaste } from '@/hooks/use-paste'
import { Icon } from '@/lib/icons'
import { getUsdcAddress, isUsdcSupportedChain } from '@/lib/tokens/usdc'
import { getUsdtAddress, isUsdtSupportedChain } from '@/lib/tokens/usdt'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'motion/react'
import { ChangeEvent, Dispatch, Ref, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react'
import { formatUnits, parseUnits, type Address } from 'viem'
import { useChainId, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { AmountInputField } from './amount-input'
import { AddressInputField, Title } from './components'
import { useSearchParams } from './params-ctx'
import type { Token } from './token-coaster'
import { tokenData } from './token-display'
import { Tokens } from './token-list'
import { TransactionHashLink } from './transaction-hash-link'
import { Balance } from './types'

interface SendingStateProps {
  amount: string
  recipient: string
  balance: Balance | null
  usdValue: number | null
}

const SendingState = ({ amount, recipient, balance, usdValue }: SendingStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className='rounded-xl bg-white/5 border border-white/10 space-y-0 overflow-hidden'>
      <div className='relative px-4 py-6'>
        <div className='flex flex-col items-center justify-center gap-4'>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className='w-12 h-12 rounded-full border-2 border-rose-300/30 border-t-rose-300 flex items-center justify-center'>
            <Icon name='arrow-right' className='w-6 h-6 text-rose-300' />
          </motion.div>
          <div className='text-center space-y-1'>
            <p className='text-sm font-brk text-white/80'>Sending Transaction</p>
            <p className='text-xs font-brk text-white/50'>Please confirm in your wallet</p>
          </div>
        </div>
        <div className='mt-6 pt-4 border-t border-white/10 space-y-3'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-brk text-white/50'>To</span>
            <span className='text-xs font-brk text-white/80 truncate max-w-50'>{recipient}</span>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-brk text-white/50'>Amount</span>
            <div className='text-right'>
              <span className='text-sm font-brk text-white'>
                {amount} {balance?.symbol ?? 'ETH'}
              </span>
              {usdValue !== null && (
                <p className='text-xs font-brk text-white/50'>
                  ≈ $
                  {usdValue.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}{' '}
                  USD
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

interface SuccessStateProps {
  amount: string
  recipient: string
  balance: Balance | null
  usdValue: number | null
  hash: `0x${string}` | null
  explorerUrl: string | null
}

const SuccessState = ({ amount, recipient, balance, usdValue, hash, explorerUrl }: SuccessStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className='rounded-xl bg-emerald-500/10 border border-emerald-400/30 space-y-0 overflow-hidden'>
      <div className='relative px-4 py-6'>
        <div className='flex flex-col items-center justify-center gap-4'>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className='w-12 h-12 rounded-full bg-emerald-400/20 flex items-center justify-center'>
            <Icon name='arrow-right' className='w-6 h-6 text-emerald-400' />
          </motion.div>
          <div className='text-center space-y-1'>
            <p className='text-sm font-brk text-emerald-300'>Transaction Successful</p>
            <p className='text-xs font-brk text-white/60'>Your transaction has been confirmed</p>
          </div>
        </div>
        <div className='mt-6 pt-4 border-t border-emerald-400/20 space-y-3'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-brk text-white/50'>To</span>
            <span className='text-xs font-brk text-white/80 truncate max-w-50'>{recipient}</span>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-brk text-white/50'>Amount</span>
            <div className='text-right'>
              <span className='text-sm font-brk text-white'>
                {amount} {balance?.symbol ?? 'ETH'}
              </span>
              {usdValue !== null && (
                <p className='text-xs font-brk text-white/50'>
                  ≈ $
                  {usdValue.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}{' '}
                  USD
                </p>
              )}
            </div>
          </div>
          {hash && (
            <div className='flex items-center justify-between pt-2'>
              <span className='text-xs font-brk text-white/50'>Transaction</span>
              <TransactionHashLink
                hash={hash}
                explorerUrl={explorerUrl}
                truncate
                className='text-xs font-brk max-w-50'
                linkClassName='text-emerald-300 hover:text-emerald-200'
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

type ReceiptStatus = {
  blockNumber: bigint
  status: 'success' | 'reverted'
} | null

interface SendTabProps {
  onSend: VoidFunction
  formattedBalance: string | null
  balance: Balance | null
  tokenPrice: number | null
  disabled: boolean
  amountInputRef: Ref<HTMLInputElement>
  addressInputRef: Ref<HTMLInputElement>
  setTo: Dispatch<SetStateAction<string>>
  setAmount: Dispatch<SetStateAction<string>>
  to: string
  amount: string
  isPending?: boolean
  isConfirming?: boolean
  receipt?: ReceiptStatus
  hash?: `0x${string}` | null
  explorerUrl?: string | null
  onReset?: VoidFunction
}
export const SendTab = ({
  formattedBalance: _formattedBalance,
  balance: _balance,
  tokenPrice,
  disabled: _disabled,
  onSend: _onSend,
  amountInputRef,
  addressInputRef,
  setTo: _setTo,
  setAmount: _setAmountProp,
  to: toProp,
  amount: amountProp,
  isPending: _isPending = false,
  isConfirming: _isConfirming = false,
  receipt: _receipt = null,
  hash: _hash = null,
  explorerUrl: _explorerUrl = null,
  onReset: _onReset
}: SendTabProps) => {
  const { params, setParams } = useSearchParams()
  const chainId = useChainId()
  const { tokens: networkTokens, isLoading: tokensLoading } = useNetworkTokens()

  // Selected token state - sync with search params
  const selectedTokenParam = params.tokenSelected
  const selectedToken: Token | null =
    selectedTokenParam === 'usdc' || selectedTokenParam === 'ethereum' || selectedTokenParam === 'usdt'
      ? selectedTokenParam
      : null
  const setSelectedToken = useCallback(
    (token: Token | null) => {
      void setParams({ tokenSelected: token ?? null })
    },
    [setParams]
  )

  // Use search params for recipient and amount, with fallback to props
  const recipient = params.to ?? toProp ?? ''
  const amount = params.amount ?? amountProp ?? ''
  const [isValid, setIsValid] = useState<boolean | null>(null)

  // Extract token list from network tokens
  const availableTokens = useMemo<Token[]>(() => {
    return networkTokens.map((t) => t.token)
  }, [networkTokens])

  // Auto-select first available token if none is selected
  useEffect(() => {
    if (!selectedToken && availableTokens.length > 0 && !tokensLoading) {
      setSelectedToken(availableTokens[0])
    }
  }, [selectedToken, availableTokens, tokensLoading, setSelectedToken])

  // Get selected token balance
  const selectedTokenBalance = useMemo(() => {
    if (!selectedToken) return null
    return networkTokens.find((t) => t.token === selectedToken) ?? null
  }, [selectedToken, networkTokens])

  // Use selected token balance if available, otherwise fall back to prop balance
  const balance = useMemo(() => {
    if (selectedTokenBalance) {
      return {
        value: selectedTokenBalance.value,
        symbol: selectedTokenBalance.token === 'ethereum' ? 'ETH' : selectedTokenBalance.token.toUpperCase(),
        decimals: selectedTokenBalance.decimals
      }
    } else if (_balance) {
      return _balance
    }
    return null
  }, [selectedTokenBalance, _balance])

  const formattedBalance = selectedTokenBalance ? selectedTokenBalance.formatted : _formattedBalance

  // Sync search params with props when props change (from external sources)
  useEffect(() => {
    if (toProp && params.to !== toProp) {
      void setParams({ to: toProp })
    }
  }, [toProp, params.to, setParams])

  useEffect(() => {
    if (amountProp && params.amount !== amountProp) {
      void setParams({ amount: amountProp })
    }
  }, [amountProp, params.amount, setParams])

  // Sync amount to parent and search params
  const handleAmountChange = useCallback(
    (value: string) => {
      _setAmountProp(value)
      void setParams({ amount: value || null })
    },
    [_setAmountProp, setParams]
  )

  // Get token price (USDC = $1, USDT = $1, native token = tokenPrice)
  const getTokenPrice = useCallback(
    (token: Token | null): number | null => {
      if (!token) return null
      if (token === 'usdc' || token === 'usdt') return 1 // USDC and USDT are always $1
      if (token === 'ethereum') return tokenPrice // ETH price
      return null
    },
    [tokenPrice]
  )

  const data = tokenData[selectedToken === 'ethereum' ? 'ETH' : (selectedToken?.toUpperCase() ?? 'ETH')] || {
    color: '#6366f1'
  }

  // Get actual balance
  const _actualBalance = useMemo(() => {
    if (!balance) return null
    return Number.parseFloat(formatUnits(balance.value, balance.decimals))
  }, [balance])

  const validateAddress = useCallback((address: string) => {
    if (!address) {
      setIsValid(null)
      return
    }
    // Simple validation - starts with 0x and has 40+ chars
    setIsValid(address.startsWith('0x') && address.length >= 40)
  }, [])

  const usdValue = useMemo(() => {
    if (!selectedToken || !amount) return null
    const parsedAmount = Number.parseFloat(amount)
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) return null
    const price = getTokenPrice(selectedToken)
    if (!price) return null
    return parsedAmount * price
  }, [amount, selectedToken, getTokenPrice])

  // Handle token selection
  const handleTokenSelect = useCallback(
    (token: Token) => {
      setSelectedToken(token)
    },
    [setSelectedToken]
  )

  // Hook for writing contracts (USDC and USDT transfers)
  const { mutate: mutateUsdc, data: usdcHash, isPending: isUsdcPending } = useWriteContract()
  const { mutate: mutateUsdt, data: usdtHash, isPending: isUsdtPending } = useWriteContract()

  // Wait for USDC transaction receipt
  const { isLoading: isUsdcConfirming, data: usdcReceipt } = useWaitForTransactionReceipt({
    hash: usdcHash,
    query: {
      enabled: !!usdcHash,
      retry: 5,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
      refetchInterval: (query) => {
        if (query.state.data) return false
        return 2000
      }
    }
  })

  // Wait for USDT transaction receipt
  const { isLoading: isUsdtConfirming, data: usdtReceipt } = useWaitForTransactionReceipt({
    hash: usdtHash,
    query: {
      enabled: !!usdtHash,
      retry: 5,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
      refetchInterval: (query) => {
        if (query.state.data) return false
        return 2000
      }
    }
  })

  // Determine transaction state based on selected token
  const isPending = selectedToken === 'usdc' ? isUsdcPending : selectedToken === 'usdt' ? isUsdtPending : _isPending
  const isConfirming =
    selectedToken === 'usdc' ? isUsdcConfirming : selectedToken === 'usdt' ? isUsdtConfirming : _isConfirming
  const _txHash = selectedToken === 'usdc' ? usdcHash : selectedToken === 'usdt' ? usdtHash : _hash
  const receipt =
    selectedToken === 'usdc'
      ? usdcReceipt
        ? {
            blockNumber: usdcReceipt.blockNumber,
            status: usdcReceipt.status === 'success' ? ('success' as const) : ('reverted' as const)
          }
        : null
      : selectedToken === 'usdt'
        ? usdtReceipt
          ? {
              blockNumber: usdtReceipt.blockNumber,
              status: usdtReceipt.status === 'success' ? ('success' as const) : ('reverted' as const)
            }
          : null
        : _receipt

  const explorerUrl = _explorerUrl

  // Check if selected token has insufficient balance
  const hasInsufficientBalance = useMemo(() => {
    if (!selectedTokenBalance || !amount) return false
    const balanceAmount = Number.parseFloat(selectedTokenBalance.formatted)
    const amountValue = Number.parseFloat(amount)
    if (Number.isNaN(amountValue)) return false
    return amountValue > balanceAmount
  }, [selectedTokenBalance, amount])

  const disabled = _disabled || hasInsufficientBalance || !selectedToken || isPending || isConfirming

  // Handle send
  const handleSend = useCallback(() => {
    if (!selectedToken || !recipient || !amount || hasInsufficientBalance) {
      return
    }

    const amountValue = Number.parseFloat(amount)
    if (Number.isNaN(amountValue) || amountValue <= 0) {
      return
    }

    try {
      if (selectedToken === 'ethereum') {
        // For ETH, use the parent's onSend handler
        _onSend()
      } else if (selectedToken === 'usdc') {
        // Send USDC using writeContract
        if (!isUsdcSupportedChain(chainId)) {
          throw new Error('USDC is not supported on this chain')
        }

        const usdcAddress = getUsdcAddress(chainId)
        if (!usdcAddress) {
          throw new Error('USDC address not found for this chain')
        }

        // USDC uses 6 decimals
        const usdcAmount = parseUnits(amountValue.toFixed(6), 6)

        // ERC20 transfer ABI
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

        mutateUsdc({
          abi: ERC20_TRANSFER_ABI,
          address: usdcAddress,
          functionName: 'transfer',
          args: [recipient as Address, usdcAmount]
        })
      } else if (selectedToken === 'usdt') {
        // Send USDT using writeContract
        if (!isUsdtSupportedChain(chainId)) {
          throw new Error('USDT is not supported on this chain')
        }

        const usdtAddress = getUsdtAddress(chainId)
        if (!usdtAddress) {
          throw new Error('USDT address not found for this chain')
        }

        // USDT uses 6 decimals
        const usdtAmount = parseUnits(amountValue.toFixed(6), 6)

        // ERC20 transfer ABI
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

        mutateUsdt({
          abi: ERC20_TRANSFER_ABI,
          address: usdtAddress,
          functionName: 'transfer',
          args: [recipient as Address, usdtAmount]
        })
      }
    } catch (error) {
      console.error('Send error:', error)
    }
  }, [selectedToken, recipient, amount, hasInsufficientBalance, chainId, _onSend, mutateUsdc, mutateUsdt])

  const { paste } = usePaste({})

  const handlePaste = useCallback(async () => {
    const pastedText = await paste()
    if (pastedText) {
      _setTo(pastedText)
      void setParams({ to: pastedText || null })
      validateAddress(pastedText)
    }
  }, [paste, _setTo, setParams, validateAddress])

  const handleOnChangeAddress = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      _setTo(value)
      void setParams({ to: value || null })
      validateAddress(value)
    },
    [_setTo, setParams, validateAddress]
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className='space-y-0'>
      {/* Token Selection */}
      <div className='mb-5'>
        <Title id='send-token-selector'>Token</Title>
        <div className='mt-2'>
          {tokensLoading ? (
            <div className='flex items-center justify-center h-24'>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                <Icon name='spinner-ring' className='w-6 h-6 text-white/40' />
              </motion.div>
            </div>
          ) : availableTokens.length > 0 ? (
            <Tokens
              tokens={availableTokens}
              tokenBalances={networkTokens}
              selectedToken={selectedToken}
              paymentAmountUsd={undefined}
              tokenPrices={{
                usdc: 1,
                usdt: 1,
                ethereum: tokenPrice ?? null
              }}
              nativeSymbol={selectedToken === 'ethereum' ? 'ETH' : undefined}
              onTokenSelect={handleTokenSelect}
            />
          ) : (
            <div className='relative h-32 rounded-xl overflow-hidden flex items-center bg-linear-to-r from-black/60 mt-4 via-black/20 to-zinc-950/50 justify-center text-white/60 text-sm'>
              <p className='line-clamp-2 max-w-[18ch] text-center font-okxs'>
                No tokens with balance found on this network
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recipient Address */}
      <AddressInputField
        label='To'
        isValid={isValid}
        value={recipient}
        pasteFn={handlePaste}
        inputRef={addressInputRef}
        onChange={handleOnChangeAddress}
      />

      {/* Amount Input / Sending / Success State */}
      <div className=''>
        <AnimatePresence mode='wait'>
          {receipt && receipt.status === 'success' ? (
            <SuccessState
              key='success'
              amount={amount}
              recipient={recipient}
              balance={balance}
              usdValue={usdValue}
              hash={_hash}
              explorerUrl={explorerUrl}
            />
          ) : isPending || isConfirming ? (
            <SendingState key='sending' amount={amount} recipient={recipient} balance={balance} usdValue={usdValue} />
          ) : (
            <AmountInputField
              balance={balance}
              tokenData={data}
              usdValue={usdValue}
              formattedBalance={formattedBalance}
              onChange={handleAmountChange}
              amountInputRef={amountInputRef}
              amount={amount}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Warning for high amount */}
      {hasInsufficientBalance && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className='p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2'>
          <Icon name='bet69' className='w-4 h-4 text-red-400 shrink-0' />
          <p className='text-sm text-red-300'>Insufficient balance for this transaction</p>
        </motion.div>
      )}

      {/* Network Fee Info */}
      <div className='p-4 rounded-xl bg-white/0 border border-white/0'>
        <div className='flex items-center justify-between text-xs md:text-sm'>
          <span className='opacity-70 font-exo font-bold uppercase italic'>Estimated Network Fee</span>
          <span className='text-white font-okxs'>
            ~0.0012 <span className='font-okxs font-light opacity-70'>ETH</span> ({' '}
            <span className='opacity-60 pr-0.5'>$</span>3.89 )
          </span>
        </div>
      </div>

      {/* Send Button / Send Another Button */}
      <motion.div
        whileHover={{ scale: disabled || isConfirming ? 1 : 1.02 }}
        whileTap={{ scale: 0.98 }}
        className='mt-4'>
        {receipt && receipt.status === 'success' && _onReset ? (
          <button
            onClick={_onReset}
            className='flex items-center justify-center w-full mx-auto h-14 text-lg font-semibold rounded-xl bg-linear-to-r from-emerald-500 via-teal-400 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-white border-0 shadow-lg transition-all'>
            <span className='flex items-center gap-2'>
              Send Another
              <Icon name='arrow-right' className='w-5 h-5' />
            </span>
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={disabled || isConfirming}
            className={cn(
              'flex items-center justify-center w-full mx-auto h-14 text-lg font-semibold rounded-xl bg-linear-to-r from-slate-300 via-rose-300 to-rose-300 text-white border-0 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed',
              {
                'hover:from-slate-200 hover:to-rose-300': !disabled && !isConfirming
              }
            )}>
            {isPending || isConfirming ? (
              <motion.div animate={{ x: [0, 10, 0] }} transition={{ duration: 0.5, repeat: Infinity }}>
                <Icon name='arrow-right' className='w-5 h-5' />
              </motion.div>
            ) : (
              <span className='flex items-center gap-2 font-exo font-bold italic drop-shadow-2xs'>
                Send
                <Icon name='arrow-right' className='w-5 h-5' />
              </span>
            )}
          </button>
        )}
      </motion.div>
    </motion.div>
  )
}
