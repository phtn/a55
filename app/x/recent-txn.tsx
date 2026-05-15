'use client'

import { Eyebrow } from '@/components/ui/eyebrow'
import { formatCurrency, formatDateTime } from '@/lib/helpers/formatters'
import { cn } from '@/lib/utils'

type Txn = {
  id: string
  name: string
  description: string
  category: string
  amount: number
  date: string
  currency: string
  status: 'posted' | 'pending'
}
interface RecentTxnProps {
  txns: Txn[]
  balance?: number
}

export const RecentTxn = ({ txns }: RecentTxnProps) => {
  // const incomeTotal = txns.filter((txn) => txn.amount > 0).reduce((total, txn) => total + txn.amount, 0)

  // const outgoingTotal = txns
  //   .filter((txn) => txn.amount < 0 && txn.status === 'posted')
  //   .reduce((total, txn) => total + Math.abs(txn.amount), 0)

  // const pendingTotal = txns
  //   .filter((txn) => txn.status === 'pending')
  //   .reduce((total, txn) => total + Math.abs(txn.amount), 0)

  // const availableBalance = balance - pendingTotal
  // const netFlow = incomeTotal - outgoingTotal
  // const previewTransactions = txns.slice(0, 4)

  return (
    <section className='rounded-xl border border-border/50 bg-border/4 p-4 sm:p-6'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <Eyebrow>Recent Txn</Eyebrow>
          <h2 className='mt-2 font-display text-2xl font-semibold tracking-tight text-foreground'>Activity</h2>
        </div>
        <p className='text-sm text-muted-foreground'>0 txn</p>
      </div>

      <div className='mt-6 space-y-2'>
        {txns.map((txn) => {
          const isCredit = txn.amount >= 0

          return (
            <div
              key={txn.id}
              className='flex items-center justify-between gap-4 rounded-lg border border-border/40 bg-background/75 px-4 py-3'>
              <div className='min-w-0'>
                <div className='flex items-center gap-2'>
                  <p className='truncate font-display text-base font-semibold text-foreground'>{txn.name}</p>
                  <span className='rounded-full bg-muted/50 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground'>
                    {txn.category}
                  </span>
                </div>
                <p className='mt-1 text-sm text-muted-foreground'>
                  {txn.description} · {formatDateTime(txn.date)}
                </p>
              </div>

              <p
                className={cn('shrink-0 font-display text-base font-semibold', {
                  'text-foreground': isCredit,
                  'text-slate-500': !isCredit
                })}>
                {formatCurrency(txn.amount, txn.currency)}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
