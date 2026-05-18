'use client'

import { AnimatedNumber } from '@/components/animated-number'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'motion/react'
import QRCode from 'qrcode'
import { useCallback, useEffect, useState } from 'react'
import { Wallet } from './wallet'

export interface PayAmountProps {
  usdValue: number
  spinRandomAmount: VoidFunction
  /** EIP-681 payment request URI (ethereum:...) for wallet scan */
  paymentRequestUri: string | null
  recipient: string | null
  /** Formatted token amount (e.g. "0.5") */
  tokenAmountFormatted: string
  /** Token symbol (e.g. "ETH", "USDC") */
  symbol: string
}

function PayQrModal({
  open,
  onClose,
  paymentRequestUri,
  tokenAmountFormatted,
  symbol,
  recipient,
  usdValue
}: {
  open: boolean
  onClose: () => void
  paymentRequestUri: string | null
  tokenAmountFormatted: string
  symbol: string
  recipient: string | null
  usdValue: number
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !paymentRequestUri) {
      Promise.resolve().then(() => setQrDataUrl(null))
      return
    }
    let cancelled = false
    QRCode.toDataURL(paymentRequestUri, { margin: 2, width: 260 })
      .then((url: string) => {
        if (!cancelled) setQrDataUrl(url)
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null)
      })
    return () => {
      cancelled = true
    }
  }, [open, paymentRequestUri])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className='fixed inset-0 z-50 cursor-pointer bg-black/60 backdrop-blur-sm'
            aria-hidden
          />
          <div className='fixed inset-0 z-200 flex items-center justify-center p-4 pointer-events-none'>
            <motion.div
              role='dialog'
              aria-modal='true'
              aria-labelledby='pay-qr-modal-title'
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={cn(
                'relative w-full max-w-md pointer-events-auto',
                'rounded-2xl border border-white/10 bg-zinc-900/95 shadow-2xl overflow-hidden'
              )}
              onClick={(e) => e.stopPropagation()}>
              <div className='absolute inset-0 bg-[url("/svg/noise.svg")] opacity-10 pointer-events-none' />

              <div className='relative px-5 pt-5 pb-5'>
                <div className='flex items-center justify-between mb-1'>
                  <h2 id='pay-qr-modal-title' className='font-polyn font-bold text-lg text-white/90'>
                    Pay with QR
                  </h2>
                  <button
                    type='button'
                    onClick={onClose}
                    className='rounded-lg p-1.5 text-white/50 hover:text-white hover:bg-white/10 transition-colors'
                    aria-label='Close'>
                    <Icon name='x' className='size-5' />
                  </button>
                </div>

                <p className='text-xs text-white/60 font-brk mb-4'>Scan with your wallet</p>

                <div className='flex flex-col items-center gap-4 p-0'>
                  {qrDataUrl ? (
                    <div className='rounded-xl overflow-hidden bg-white p-3'>
                      {/* eslint-disable-next-line @next/next/no-img-element -- QR data URL; next/image not applicable */}
                      <img src={qrDataUrl} alt='Payment QR code' className='w-64 h-64 block' width={208} height={208} />
                    </div>
                  ) : paymentRequestUri ? (
                    <div className='w-52 h-52 rounded-xl bg-white/10 flex items-center justify-center'>
                      <Icon name='spinner-ring' className='size-10 text-white/50 animate-spin' />
                    </div>
                  ) : (
                    <div className='w-52 h-52 rounded-xl bg-white/10 flex items-center justify-center'>
                      <p className='text-sm text-white/50'>No payment request</p>
                    </div>
                  )}

                  <div className='w-full space-y-2 text-center'>
                    <div className='flex justify-between text-sm'>
                      <span className='text-white text-sm font-exo font-bold italic uppercase'>Amount</span>
                      <span className='font-okxs text-white'>
                        {tokenAmountFormatted} <span className='uppercase text-white/70'>{symbol}</span>
                      </span>
                    </div>
                    <div className='flex justify-between text-sm'>
                      <span className='text-white text-sm font-exo font-bold italic uppercase'>usd</span>
                      <span className='font-okxs font-medium text-white'>
                        $
                        {usdValue.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </span>
                    </div>
                    {recipient && (
                      <div className='_flex gap-4 pt-1 overflow-scroll hidden'>
                        <span className='text-white/50 font-exo uppercase italic text-xs text-left'>To</span>
                        <span className='font-mono text-xs text-white/80 text-left'>{recipient}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

export function PayAmount({
  usdValue,
  spinRandomAmount,
  paymentRequestUri,
  recipient,
  tokenAmountFormatted,
  symbol
}: PayAmountProps) {
  const [showQrModal, setShowQrModal] = useState(false)

  const openQrModal = useCallback(() => setShowQrModal(true), [])
  const closeQrModal = useCallback(() => setShowQrModal(false), [])

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{
          layout: { duration: 0.3, ease: 'easeInOut' },
          ease: 'easeInOut'
        }}
        className='mt-3'>
        <div className='p-1 md:p-4 border-b decoration-1 decoation-dotted border-white/10 space-y-1'>
          <div className='flex items-center space-x-0'>
            <h3 className='px-2 font-brk text-xs md:text-sm uppercase opacity-70 dark:text-slate-300'>You pay</h3>
          </div>
          <div className='flex items-center justify-between text-xs md:text-base'>
            <div className='font-display text-right px-2'>
              <MoneyFormat value={usdValue} />
            </div>
            <div className='flex items-center space-x-8'>
              <button
                type='button'
                disabled={!paymentRequestUri}
                onClick={openQrModal}
                className='hidden _relative btn btn-ghost btn-lg btn-circle bg-transparent backdrop-blur-lg hover:bg-transparent'>
                <Icon
                  name='re-up.ph'
                  className={cn('size-4 md:size-6 dark:text-white ', {
                    'dark:text-slate-300/50': !paymentRequestUri
                  })}
                />
              </button>
              <button
                onClick={spinRandomAmount}
                className='hidden btn btn-ghost btn-lg btn-circle hover:bg-transparent backdrop-blur-3xl'>
                <motion.div className='relative flex items-center justify-center h-6 w-6 aspect-square'>
                  <Icon name='bet69' className='absolute size-4 md:size-6 dark:text-white' />
                </motion.div>
              </button>
              <div className='rounded-full w-fit relative z-40'>
                <Wallet />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <PayQrModal
        open={showQrModal}
        onClose={closeQrModal}
        paymentRequestUri={paymentRequestUri}
        tokenAmountFormatted={tokenAmountFormatted}
        symbol={symbol}
        recipient={recipient}
        usdValue={usdValue}
      />
    </>
  )
}

export const MoneyFormat = ({ value }: { value: number }) => {
  return (
    <span className='dark:text-white text-2xl font-okxs'>
      $
      <AnimatedNumber
        value={value}
        format={(v) => v.toFixed(2)}
        precision={3}
        stiffness={100}
        mass={0.1}
        damping={120}
      />
    </span>
  )
}
