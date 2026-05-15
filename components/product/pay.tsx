'use client'

import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { useCrypto } from '@/hooks/use-crypto'
import { PayTab } from '@/lib/appkit/pay'
import { DEFAULT_ALLOWED_PAY_NETWORKS, type PayNetworkName } from '@/lib/appkit/pay-config'
import { SearchParamsProvider, useSearchParams } from '@/lib/appkit/search-params-context'
import type { PaymentSuccessContext } from '@/lib/appkit/types'
import { computeCryptoRelayTargetCents } from '@/lib/fees/processing'
import { useMutation, useQuery } from 'convex/react'
import { useParams } from 'next/navigation'
import { useCallback, useMemo, useRef, useState } from 'react'

const CRYPTO_WALLET_IDENTIFIER = 'crypto_wallet_addresses'

const NETWORK_DEFAULTS: Record<PayNetworkName, boolean> = {
  bitcoin: true,
  ethereum: true,
  polygon: true,
  sepolia: false,
  amoy: false
}

const NETWORK_ORDER = ['bitcoin', 'ethereum', 'polygon', 'sepolia', 'amoy'] as const satisfies readonly PayNetworkName[]

const getNetworkEnabled = (value: unknown, key: PayNetworkName): boolean => {
  if (typeof value === 'string') {
    return value.trim().length > 0 || NETWORK_DEFAULTS[key]
  }

  if (value && typeof value === 'object') {
    const config = value as Record<string, unknown>
    if (typeof config.active === 'boolean') {
      return config.active
    }
  }

  return NETWORK_DEFAULTS[key]
}

const parseEnabledNetworks = (value: unknown): readonly PayNetworkName[] => {
  if (!value || typeof value !== 'object' || 'error' in value) {
    return DEFAULT_ALLOWED_PAY_NETWORKS
  }

  const wallets = value as Record<string, unknown>
  const enabledNetworks = NETWORK_ORDER.filter((key) => getNetworkEnabled(wallets[key], key))

  return enabledNetworks.length > 0 ? enabledNetworks : DEFAULT_ALLOWED_PAY_NETWORKS
}

interface CryptoPayContentProps {
  accountId: Id<'accounts'>
}

const CryptoPayContent = ({ accountId }: CryptoPayContentProps) => {
  const params = useParams()
  const refNumber = params.orderId as string
  const order = useQuery(api.orders.q.getOrderByRefNumber, { refNumber })
  const cryptoNetworksSetting = useQuery(api.admin.q.getAdminByIdentStrict, {
    identifier: CRYPTO_WALLET_IDENTIFIER
  })
  const updateOrder = useMutation(api.orders.m.updateOrder)
  const { setParams } = useSearchParams()
  const { getBySymbol } = useCrypto()
  const [amount, setAmount] = useState('')
  const paymentSyncedTxHashRef = useRef<`0x${string}` | null>(null)
  const addressInputRef = useRef<HTMLInputElement>(null)
  const amountInputRef = useRef<HTMLInputElement>(null)

  const ethPrice = useMemo(() => getBySymbol('ETH')?.price ?? null, [getBySymbol])

  const defaultPaymentAmountUsd = useMemo(() => {
    if (order == null || order === undefined) return undefined
    return (
      (order.totalWithCryptoFeeCents ??
        computeCryptoRelayTargetCents({
          totalCents: order.totalCents,
          processingFeeCents: order.processingFeeCents
        })) / 100
    ).toFixed(2)
  }, [order])

  const defaultRelayAmountUsd = useMemo(() => {
    if (order == null || order === undefined) return undefined
    return (
      computeCryptoRelayTargetCents({
        totalCents: order.totalCents,
        processingFeeCents: order.processingFeeCents
      }) / 100
    )
  }, [order])

  const allowedNetworks = useMemo(() => parseEnabledNetworks(cryptoNetworksSetting), [cryptoNetworksSetting])

  const handleReset = useCallback(() => {
    setAmount('')
    void setParams({
      tokenSelected: null,
      paymentAmountUsd: null,
      to: null,
      amount: null
    })
  }, [setParams])

  const handlePaymentSuccess = useCallback(
    async (transactionHash: `0x${string}`, context?: PaymentSuccessContext) => {
      if (!order || order.payment.status === 'paid') return
      if (paymentSyncedTxHashRef.current === transactionHash) return

      paymentSyncedTxHashRef.current = transactionHash
      try {
        await updateOrder({
          id: order._id,
          accountId,
          refNumber,
          userId: '',
          payment: {
            ...order.payment,
            status: 'paid',
            txnId: transactionHash,
            asset: context?.asset ?? null,
            chain: context?.chain ?? order.payment.chain,
            nativeValue: context?.nativeValue ?? order.payment.nativeValue,
            usdValue: context?.usdValue ?? order.payment.usdValue,
            paidAt: Date.now()
          },
          status: 'completed',
          currency: '',
          totalCents: 0,
          processingFeeCents: 0,
          totalWithCryptoFeeCents: 0
        })
      } catch (error) {
        paymentSyncedTxHashRef.current = null
        console.error('Failed to update order payment status:', error)
      }
    },
    [order, refNumber, updateOrder, accountId]
  )

  return (
    <div className='relative z-100 md:w-3xl md:max-w-3xl md:mx-auto flex h-full bg-sidebar'>
      <div className='w-full relative bg-linear-to-br dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-950 overflow-hidden'>
        <PayTab
          onPaymentSuccess={handlePaymentSuccess}
          addressInputRef={addressInputRef}
          amountInputRef={amountInputRef}
          disabled={false}
          setAmount={setAmount}
          amount={amount}
          formattedBalance={null}
          balance={null}
          tokenPrice={ethPrice}
          defaultPaymentAmountUsd={defaultPaymentAmountUsd}
          defaultRelayAmountUsd={defaultRelayAmountUsd}
          onReset={handleReset}
          allowedNetworks={allowedNetworks}
        />
      </div>
    </div>
  )
}

export const CryptoPay = ({ accountId }: { accountId: Id<'accounts'> }) => {
  return (
    <SearchParamsProvider>
      <CryptoPayContent accountId={accountId} />
    </SearchParamsProvider>
  )
}
