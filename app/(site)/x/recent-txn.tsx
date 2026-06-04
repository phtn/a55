'use client'

import { useTheme } from '@/components/theme-provider'
import { Eyebrow } from '@/components/ui/eyebrow'
import { Doc } from '@/convex/_generated/dataModel'
import { formatCurrency } from '@/lib/helpers/formatters'
import { cn } from '@/lib/utils'
import { PixelGrid } from 'three-px-react'

interface RecentTxnProps {
  txns: Doc<'txns'>[] | null
  balance?: number
}

export const RecentTxn = ({ txns }: RecentTxnProps) => {
  const { resolvedTheme } = useTheme()
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
  if (!txns)
    return (
      <div className='flex items-center justify-center size-5 aspect-square'>
        <PixelGrid
          animation='snake'
          color={resolvedTheme === 'dark' ? '#f5f5f5' : '#CCC'}
          className='md:scale-96 scale-85'
          duration={1200}
        />
      </div>
    )

  return (
    <section className='rounded-md border border-border/20 bg-border/20 p-2 sm:p-4 md:p-6'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
        <div className='w-full'>
          <div className='flex items-center justify-between w-full'>
            <Eyebrow>Recent Activity</Eyebrow>
            <Eyebrow>{txns.length} Txns</Eyebrow>
          </div>
        </div>
      </div>

      <div className='mt-4 space-y-2'>
        {txns.map((txn) => {
          const isCredit = txn.amount >= 0

          return (
            <div
              key={txn._id}
              className='flex items-center justify-between gap-4 rounded-lg border border-border/40 bg-background/75 p-2 md:p-3'>
              <div className='min-w-0'>
                <div className='flex items-center gap-2'>
                  <p className='truncate font-display text-base font-semibold text-foreground'>{txn.title}</p>
                  <Eyebrow>{txn.status}</Eyebrow>
                </div>
                <p className='mt-1 text-sm text-muted-foreground'>
                  {txn.description} · {txn.createdAt}
                </p>
              </div>

              <p
                className={cn('shrink-0 font-display text-base font-semibold', {
                  'text-foreground': isCredit,
                  'text-slate-500': !isCredit
                })}>
                {formatCurrency(txn.amount)}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
