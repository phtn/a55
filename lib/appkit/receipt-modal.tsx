'use client'

import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {AnimatePresence, motion} from 'motion/react'
import {TransactionHashLink} from './transaction-hash-link'

export interface ReceiptModalProps {
  open: boolean
  onClose: () => void
  amount: string
  symbol: string
  usdValue: number | null
  hash: `0x${string}` | null
  explorerUrl: string | null
  recipient: string | null
  blockNumber?: bigint
  /** ISO date string */
  timestamp?: string
}

type ReceiptData = Pick<
  ReceiptModalProps,
  | 'amount'
  | 'symbol'
  | 'usdValue'
  | 'hash'
  | 'explorerUrl'
  | 'recipient'
  | 'blockNumber'
  | 'timestamp'
>

function buildReceiptText(data: ReceiptData): string {
  const lines = [
    '——— PAYMENT RECEIPT ———',
    '',
    `Date: ${data.timestamp ?? new Date().toISOString()}`,
    `Amount: ${data.amount} ${data.symbol}`,
    data.usdValue !== null
      ? `USD Value: $${data.usdValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
      : null,
    `To: ${data.recipient ?? '—'}`,
    data.blockNumber !== undefined
      ? `Block: ${data.blockNumber.toString()}`
      : null,
    data.hash ? `Transaction: ${data.hash}` : null,
    data.explorerUrl ? `Explorer: ${data.explorerUrl}` : null,
    '',
    '——— END RECEIPT ———',
  ]
  return lines.filter(Boolean).join('\n')
}

function buildReceiptJson(data: ReceiptData): string {
  return JSON.stringify(
    {
      type: 'payment_receipt',
      date: data.timestamp ?? new Date().toISOString(),
      amount: data.amount,
      symbol: data.symbol,
      usdValue: data.usdValue,
      recipient: data.recipient,
      blockNumber: data.blockNumber?.toString(),
      transactionHash: data.hash,
      explorerUrl: data.explorerUrl,
    },
    null,
    2,
  )
}

export function ReceiptModal({
  open,
  onClose,
  amount,
  symbol,
  usdValue,
  hash,
  explorerUrl,
  recipient,
  blockNumber,
  timestamp,
}: ReceiptModalProps) {
  const receiptData: ReceiptData = {
    amount,
    symbol,
    usdValue,
    hash,
    explorerUrl,
    recipient,
    blockNumber,
    timestamp,
  }

  const handleDownload = (format: 'txt' | 'json') => {
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
    const base = `payment-receipt-${ts}`

    if (format === 'txt') {
      const blob = new Blob([buildReceiptText(receiptData)], {
        type: 'text/plain;charset=utf-8',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${base}.txt`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      const blob = new Blob([buildReceiptJson(receiptData)], {
        type: 'application/json;charset=utf-8',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${base}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            onClick={onClose}
            className='fixed inset-0 z-50 cursor-pointer bg-black/60 backdrop-blur-sm'
            aria-hidden
          />
          <div className='fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none'>
            <motion.div
              role='dialog'
              aria-modal='true'
              aria-labelledby='receipt-modal-title'
              initial={{opacity: 0, scale: 0.95, y: 8}}
              animate={{opacity: 1, scale: 1, y: 0}}
              exit={{opacity: 0, scale: 0.95, y: 8}}
              transition={{type: 'spring', damping: 25, stiffness: 300}}
              className={cn(
                'relative w-full max-w-md pointer-events-auto',
                'rounded-2xl border border-white/10 bg-zinc-900/95 shadow-2xl overflow-hidden',
              )}
              onClick={(e) => e.stopPropagation()}>
              <div className='absolute inset-0 bg-[url("/svg/noise.svg")] opacity-10 pointer-events-none' />

              <div className='relative px-5 pt-5 pb-1'>
                <div className='flex items-center justify-between mb-4'>
                  <h2
                    id='receipt-modal-title'
                    className='font-clash font-bold text-lg text-white/90'>
                    Payment Receipt
                  </h2>
                  <button
                    type='button'
                    onClick={onClose}
                    className='rounded-lg p-1.5 text-white/50 hover:text-white hover:bg-white/10 transition-colors'
                    aria-label='Close'>
                    <Icon name='x' className='size-5' />
                  </button>
                </div>

                <div className='space-y-3 rounded-xl border border-white/10 bg-white/5 p-4'>
                  <div className='flex justify-between text-sm'>
                    <span className='text-white/50 font-exo uppercase italic'>
                      Amount
                    </span>
                    <span className='font-okxs text-white'>
                      {amount}{' '}
                      <span className='uppercase text-white/70'>{symbol}</span>
                    </span>
                  </div>
                  {usdValue !== null && (
                    <div className='flex justify-between text-sm'>
                      <span className='text-white/50 font-exo uppercase italic'>
                        USD
                      </span>
                      <span className='font-okxs text-white'>
                        $
                        {usdValue.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}
                  {recipient && (
                    <div className='flex justify-between text-sm gap-2'>
                      <span className='text-white/50 font-exo uppercase italic shrink-0'>
                        To
                      </span>
                      <span className='font-mono text-xs text-white/80 truncate text-right'>
                        {recipient}
                      </span>
                    </div>
                  )}
                  {blockNumber !== undefined && (
                    <div className='flex justify-between text-sm'>
                      <span className='text-white/50 font-exo uppercase italic'>
                        Block
                      </span>
                      <span className='font-brk text-white/80'>
                        {blockNumber.toString()}
                      </span>
                    </div>
                  )}
                  {hash && (
                    <div className='flex flex-col gap-1 pt-1'>
                      <span className='text-white/50 font-exo uppercase italic text-xs'>
                        Transaction
                      </span>
                      <TransactionHashLink
                        hash={hash}
                        explorerUrl={explorerUrl}
                        truncate={false}
                        className='text-xs'
                        linkClassName='text-emerald-400 hover:text-emerald-300'
                      />
                    </div>
                  )}
                </div>

                <div className='flex items-center flex-wrap gap-2 mt-4'>
                  <span className='text-xs font-brk'>Download options:</span>
                  <button
                    type='button'
                    onClick={() => handleDownload('txt')}
                    className='font-okxs flex items-center px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors'>
                    TXT
                  </button>
                  <button
                    type='button'
                    onClick={() => handleDownload('json')}
                    className='font-okxs flex items-center px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors'>
                    JSON
                  </button>
                  <button
                    type='button'
                    onClick={() => handleDownload('json')}
                    className='font-okxs flex items-center px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors'>
                    JPG
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
