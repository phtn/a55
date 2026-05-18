'use client'

import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import type { PaymentSuccessContext } from '@/lib/appkit/types'
import { PayTab } from '@/lib/appkit/pay'
import { useSearchParams } from '@/lib/appkit/params-ctx'
import { Icon, IconName } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { useMutation } from 'convex/react'
import { parseAsArrayOf, parseAsString, useQueryState } from 'nuqs'
import { useMemo, useRef, useState } from 'react'
import { Button } from '../ui/button'
import { NetworkSelect } from './network-select'
import { ProductCard } from './product-card'
import { TokenSelect } from './token-select'
import { useProductPaymentSelection } from './use-product-payment-selection'

export interface Product {
  id: string
  icon: IconName
  title: string
  price: number
  level: number
  description?: string
}

const PRODUCT_IDS = ['white', 'mase', 'ivey']
const arrayParser = parseAsArrayOf(parseAsString, ',')
const USD_CURRENCY_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

interface ProductListProps {
  accountId: Id<'accounts'> | null
}

export const ProductList = ({ accountId }: ProductListProps) => {
  const createOrder = useMutation(api.orders.m.createOrder)
  const confirmOrderPayment = useMutation(api.orders.m.confirmOrderPayment)
  const { setParams } = useSearchParams()
  const products: Product[] = [
    {
      id: 'white',
      title: 'Dana White',
      description: 'An King level tier. Suitable for mortals vulnerable to pain.',
      price: 15,
      level: 1,
      icon: 'abstract'
    },
    {
      id: 'mase',
      title: 'Mikki Mase',
      description:
        'A Demigod level tier. Suitable for players who loves to be around bitches. These players are also known for their ability to wield and ride the lightning.',
      price: 30,
      level: 2,
      icon: 'aquarius'
    },
    {
      id: 'ivey',
      title: 'Phil Ivey',
      description:
        'A Regicidal level tier. Suitable for players who knows exactly what they want. Ultra self-aware and can never be perturbed.',
      price: 70,
      level: 3,
      icon: 'amethyst'
    }
  ]
  // let's wire up nuqs to handle the product selection
  const [selectedProduct, setSelectedProduct] = useQueryState('product', arrayParser.withDefault(PRODUCT_IDS))
  const selectedProductDetails = products.find((product) => product.id === selectedProduct[0]) ?? null
  const selectedProductPricePhp = selectedProductDetails?.price ?? 0
  const requiredProductPricePhp = selectedProductPricePhp * 1
  const [isPaying, setIsPaying] = useState(false)
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)
  const [isConfirmingOrder, setIsConfirmingOrder] = useState(false)
  const [orderError, setOrderError] = useState<string | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [activeOrder, setActiveOrder] = useState<{ id: Id<'orders'>; refNumber: string } | null>(null)
  const paymentSyncedTxHashRef = useRef<`0x${string}` | null>(null)
  const amountInputRef = useRef<HTMLInputElement>(null)
  const addressInputRef = useRef<HTMLInputElement>(null)
  const {
    exchangeRateError,
    handleNetworkChange,
    handleTokenChange,
    isTokenLoading,
    requiredUsdValue,
    selectedNetwork,
    selectedToken,
    tokenOptions
  } = useProductPaymentSelection({
    requiredPhpValue: requiredProductPricePhp
  })
  const selectedTokenOption = useMemo(
    () => tokenOptions.find((tokenOption) => tokenOption.token === selectedToken) ?? null,
    [selectedToken, tokenOptions]
  )
  const canBuyNow =
    !isCreatingOrder &&
    !isConfirmingOrder &&
    !!accountId &&
    !isTokenLoading &&
    !exchangeRateError &&
    !!selectedNetwork &&
    !!selectedToken &&
    !!requiredUsdValue &&
    requiredUsdValue > 0 &&
    !!selectedTokenOption &&
    !selectedTokenOption.isDisabled
  const handleProductSelect = (productId: string) => {
    setSelectedProduct([productId])
  }
  const handleViewAll = () => {
    setSelectedProduct(PRODUCT_IDS)
  }
  const resetPayState = () => {
    setIsPaying(false)
    setPaymentAmount('')
    setActiveOrder(null)
    setOrderError(null)
    paymentSyncedTxHashRef.current = null
    void setParams({
      paymentAmountUsd: null
    })
  }
  const handleClosePay = () => {
    if (isConfirmingOrder) {
      return
    }

    resetPayState()
  }
  const handleBuyNow = async () => {
    if (
      !canBuyNow ||
      !accountId ||
      !requiredUsdValue ||
      !selectedNetwork ||
      !selectedToken ||
      !selectedProductDetails
    ) {
      return
    }

    const paymentAmountUsd = requiredUsdValue.toFixed(2)
    const totalCents = Math.round(requiredProductPricePhp * 100)

    setOrderError(null)
    setIsCreatingOrder(true)

    try {
      const order = await createOrder({
        accountId,
        currency: 'PHP',
        totalCents,
        productId: selectedProductDetails.id,
        productName: selectedProductDetails.title,
        productDescription: selectedProductDetails.description ?? '',
        productLevel: selectedProductDetails.level,
        processingFeeCents: 0,
        totalWithCryptoFeeCents: totalCents,
        paymentAsset: selectedToken,
        paymentChain: selectedNetwork,
        paymentUsdValue: requiredUsdValue
      })

      setActiveOrder(order)
      paymentSyncedTxHashRef.current = null
      setPaymentAmount(paymentAmountUsd)
      await setParams({
        tabId: 'pay',
        network: selectedNetwork,
        tokenSelected: selectedToken,
        paymentAmountUsd,
        amount: null,
        to: null
      })
      setIsPaying(true)
    } catch (error) {
      setOrderError(error instanceof Error ? error.message : 'Failed to create order.')
    } finally {
      setIsCreatingOrder(false)
    }
  }
  const handlePaymentSuccess = async (transactionHash: `0x${string}`, context?: PaymentSuccessContext) => {
    if (!activeOrder || paymentSyncedTxHashRef.current === transactionHash) {
      return
    }

    paymentSyncedTxHashRef.current = transactionHash
    setOrderError(null)
    setIsConfirmingOrder(true)

    try {
      await confirmOrderPayment({
        id: activeOrder.id,
        txnId: transactionHash,
        asset: context?.asset ?? selectedToken ?? null,
        chain: context?.chain ?? selectedNetwork ?? '',
        nativeValue: context?.nativeValue ?? undefined,
        usdValue: context?.usdValue ?? requiredUsdValue ?? undefined
      })
      resetPayState()
    } catch (error) {
      paymentSyncedTxHashRef.current = null
      setOrderError(error instanceof Error ? error.message : 'Failed to confirm order payment.')
      console.error('Failed to confirm order payment:', error)
    } finally {
      setIsConfirmingOrder(false)
    }
  }

  return (
    <>
      <section className='h-80 md:h-96'>
        <div className='min-h-84 md:min-h-96 rounded-md bg-linear-to-r from-border/5 via-border/20 to-border/5 px-4 py-2'>
          <div className='flex items-center justify-between'>
            <h2 className='flex items-center space-x-3 h-14 font-display font-medium'>
              <Icon name='tag-chevron' className='opacity-80' />
              <span>Add Stake</span>
            </h2>
            {selectedProduct.length < 3 && (
              <Button onClick={handleViewAll} variant='ghost'>
                View All
              </Button>
            )}
          </div>
          <div
            className={cn(
              'flex items-start justify-start p-4 md:p-8 h-64 md:h-75 bg-foreground/25 rounded-lg overflow-scroll',
              { 'bg-foreground/15': selectedProduct.length < 3 }
            )}>
            <ul className='flex items-center space-x-4 md:space-x-8'>
              {products
                .filter((product) => selectedProduct.includes(product.id))
                .map((product) => (
                  <li key={product.id}>
                    <ProductCard
                      product={product}
                      isSelected={selectedProduct.includes(product.id)}
                      onSelect={handleProductSelect}
                    />
                  </li>
                ))}
            </ul>
            {selectedProduct.length < 3 && (
              <div className='flex flex-col justify-between h-full w-full'>
                <div className='flex items-start'>
                  <div className='px-6 w-full'>
                    <h2 className='font-poly font-bold text-2xl'>{selectedProductDetails?.title}</h2>
                    <p className='font-display'>{selectedProductDetails?.description}</p>
                  </div>
                  <div className='w-32 h-28 border border-foreground rounded-lg flex flex-col items-center justify-center flex-1 aspect-square bg-background space-y-2'>
                    <p className='font-poly font-semibold text-sm opacity-70'>You pay</p>
                    <p className='font-display text-lg text-foreground'>
                      {exchangeRateError
                        ? 'FX unavailable'
                        : requiredUsdValue == null
                          ? 'Loading FX...'
                          : `${USD_CURRENCY_FORMATTER.format(requiredUsdValue)}`}
                    </p>
                  </div>
                </div>
                <div className='space-y-2 ps-4'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-2'>
                      <NetworkSelect value={selectedNetwork} onValueChange={handleNetworkChange} />
                      <TokenSelect
                        exchangeRateError={exchangeRateError}
                        options={tokenOptions}
                        requiredUsdValue={requiredUsdValue}
                        value={selectedToken}
                        selectedNetwork={selectedNetwork}
                        isLoading={isTokenLoading}
                        onValueChange={handleTokenChange}
                      />
                    </div>
                    <Button
                      size='lg'
                      id='buy-now'
                      disabled={!canBuyNow}
                      onClick={handleBuyNow}
                      className='flex items-center space-x-2 rounded-md h-12 font-poly font-semibold text-base px-8 italic'>
                      <span>{isCreatingOrder ? 'Creating...' : 'Buy Now'}</span>
                      <Icon name='chevrons-right' className='size-6' />
                    </Button>
                  </div>
                  {orderError ? <p className='text-sm text-red-500'>{orderError}</p> : null}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {isPaying ? (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-background/75 p-4 backdrop-blur-sm'
          onClick={handleClosePay}>
          <div
            className='relative w-full max-w-4xl overflow-hidden rounded-2xl border border-border/40 bg-sidebar shadow-2xl'
            onClick={(event) => event.stopPropagation()}>
            <Button
              variant='ghost'
              size='icon'
              className='absolute top-3 right-3 z-10'
              disabled={isConfirmingOrder}
              onClick={handleClosePay}>
              <Icon name='close' className='size-5' />
            </Button>
            <PayTab
              onReset={handleClosePay}
              onPaymentSuccess={handlePaymentSuccess}
              addressInputRef={addressInputRef}
              amountInputRef={amountInputRef}
              disabled={isConfirmingOrder}
              setAmount={setPaymentAmount}
              amount={paymentAmount}
              formattedBalance={null}
              balance={null}
              tokenPrice={null}
              defaultPaymentAmountUsd={requiredUsdValue?.toFixed(2)}
            />
            {orderError ? <p className='border-t border-border/40 px-6 py-4 text-sm text-red-500'>{orderError}</p> : null}
          </div>
        </div>
      ) : null}
    </>
  )
}
