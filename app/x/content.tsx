'use client'

import { EvilAreaChart } from '@/components/evilcharts/charts/area-chart'
import type { ChartConfig } from '@/components/evilcharts/ui/chart'
import { Eyebrow } from '@/components/ui/eyebrow'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'

const CHART_COLOR = 'var(--foreground)'

type BalancePoint = {
  label: string
  balance: number
}

type Transaction = {
  id: string
  name: string
  description: string
  category: string
  amount: number
  date: string
  status: 'posted' | 'pending'
}

const ACCOUNT_HISTORY: BalancePoint[] = [{ label: 'May', balance: 0.0 }]

const RECENT_TRANSACTIONS: Transaction[] = []

const BALANCE_CHART_CONFIG = {
  balance: {
    label: 'Balance',
    colors: {
      light: [CHART_COLOR],
      dark: [CHART_COLOR]
    }
  }
} satisfies ChartConfig

const CURRENCY_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

const COMPACT_CURRENCY_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1
})

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric'
})

const DECIMAL_FORMATTER = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1
})

const formatCurrency = (value: number) => CURRENCY_FORMATTER.format(value)

const formatCompactCurrency = (value: number) => COMPACT_CURRENCY_FORMATTER.format(value)

const formatSignedCurrency = (value: number) => `${value >= 0 ? '+' : '-'}${formatCurrency(Math.abs(value))}`

const formatPercent = (value: number) => `${value >= 0 ? '+' : ''}${DECIMAL_FORMATTER.format(value)}%`

const formatDate = (value: string) => DATE_FORMATTER.format(new Date(value))

const currentBalance = ACCOUNT_HISTORY[ACCOUNT_HISTORY.length - 1]?.balance ?? 0
const previousBalance = ACCOUNT_HISTORY[ACCOUNT_HISTORY.length - 2]?.balance ?? currentBalance
const balanceChange = currentBalance - previousBalance
const balanceChangePercent = previousBalance === 0 ? 0 : (balanceChange / previousBalance) * 100

const incomeTotal = RECENT_TRANSACTIONS.filter((transaction) => transaction.amount > 0).reduce(
  (total, transaction) => total + transaction.amount,
  0
)

const outgoingTotal = RECENT_TRANSACTIONS.filter(
  (transaction) => transaction.amount < 0 && transaction.status === 'posted'
).reduce((total, transaction) => total + Math.abs(transaction.amount), 0)

const pendingTotal = RECENT_TRANSACTIONS.filter((transaction) => transaction.status === 'pending').reduce(
  (total, transaction) => total + Math.abs(transaction.amount),
  0
)

const availableBalance = currentBalance - pendingTotal
const netFlow = incomeTotal - outgoingTotal
const previewTransactions = RECENT_TRANSACTIONS.slice(0, 4)

export const Content = () => {
  return (
    <div className='max-w-6xl space-y-4 md:space-y-8'>
      <section className='space-y-2'>
        <div className='flex gap-4 items-end lg:justify-between'>
          <div className='max-w-2xl space-y-1 h-16 flex flex-col justify-center w-full px-1'>
            <Eyebrow>Funding</Eyebrow>
            <h1 className='font-poly font-bold text-foreground text-lg md:text-xl tracking-tight'>Account 01</h1>
          </div>

          <div className='rounded-sm bg-foreground/20 px-4 py-3 text-left lg:text-right min-w-54'>
            <Eyebrow>Stake Total Value</Eyebrow>
            <p className='mt-1 font-display text-sm font-medium text-foreground'>$0</p>
          </div>
        </div>
      </section>

      <section className='grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_18rem]'>
        <div className='rounded-xl border border-border/50 bg-border/4 p-4 sm:p-6'>
          <div className='flex flex-col gap-6'>
            <div className='flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between'>
              <div className='space-y-4'>
                {currentBalance > 0 && (
                  <div className='inline-flex items-center gap-2 rounded-full bg-background/80 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-foreground/55'>
                    <span className='size-1.5 rounded-full bg-foreground/70' />
                    <Eyebrow>Active</Eyebrow>
                  </div>
                )}

                <div className='space-y-2'>
                  <p className='font-display text-4xl font-semibold tracking-tight text-foreground md:text-4xl'>
                    {formatCurrency(currentBalance)}
                  </p>
                  {currentBalance > 0 && (
                    <div className='flex flex-wrap items-center gap-3 text-sm'>
                      <div
                        className={cn('inline-flex items-center gap-1.5 font-display', {
                          'text-foreground': balanceChange >= 0,
                          'text-slate-500': balanceChange < 0
                        })}>
                        <Icon name={balanceChange >= 0 ? 'trending-up' : 'trending-down'} className='size-4' />
                        <span>{formatSignedCurrency(balanceChange)} this month</span>
                      </div>
                      <span className='text-muted-foreground'>{formatPercent(balanceChangePercent)}</span>
                    </div>
                  )}
                </div>
              </div>

              {currentBalance > 0 && (
                <div className='grid grid-cols-2 gap-2 sm:min-w-64'>
                  <div className='rounded-lg bg-background/80 p-3'>
                    <Eyebrow>Available</Eyebrow>
                    <p className='mt-2 font-display text-base font-medium text-foreground'>
                      {formatCurrency(availableBalance)}
                    </p>
                  </div>
                  <div className='rounded-lg bg-background/80 p-3'>
                    <Eyebrow>Pending</Eyebrow>
                    <p className='mt-2 font-display text-base font-medium text-foreground'>
                      {formatCurrency(pendingTotal)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {currentBalance > 0 && (
              <div className='h-64' data-accounts-balance-chart>
                <EvilAreaChart
                  data={ACCOUNT_HISTORY}
                  chartConfig={BALANCE_CHART_CONFIG}
                  xDataKey='label'
                  yDataKey='balance'
                  className='h-full w-full min-h-0 aspect-auto!'
                  chartProps={{
                    margin: {
                      top: 8,
                      right: 10,
                      bottom: 0,
                      left: 6
                    }
                  }}
                  curveType='monotone'
                  strokeVariant='solid'
                  areaVariant='gradient'
                  hideLegend
                  tooltipVariant='frosted-glass'
                  tooltipRoundness='xl'
                  xAxisProps={{
                    tickMargin: 10
                  }}
                  yAxisProps={{
                    tickFormatter: (value) => formatCompactCurrency(Number(value))
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <aside className='rounded-xl border border-border/50 bg-background/70 p-5'>
          <Eyebrow>Snapshot</Eyebrow>
          <div className='mt-4 space-y-4'>
            <div className='border-b border-border/40 pb-4'>
              <p className='text-[10px] uppercase tracking-[0.18em] text-foreground/45'>Incoming</p>
              <p className='mt-1 font-display text-xl font-semibold text-foreground'>{formatCurrency(incomeTotal)}</p>
            </div>
            <div className='border-b border-border/40 pb-4'>
              <p className='text-[10px] uppercase tracking-[0.18em] text-foreground/45'>Outgoing</p>
              <p className='mt-1 font-display text-xl font-semibold text-foreground'>{formatCurrency(outgoingTotal)}</p>
            </div>
            <div>
              <p className='text-[10px] uppercase tracking-[0.18em] text-foreground/45'>Net flow</p>
              <p className='mt-1 font-display text-xl font-semibold text-foreground'>{formatSignedCurrency(netFlow)}</p>
            </div>
          </div>
        </aside>
      </section>

      <section className='rounded-xl border border-border/50 bg-border/4 p-4 sm:p-6'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <Eyebrow>Recent Txn</Eyebrow>
            <h2 className='mt-2 font-display text-2xl font-semibold tracking-tight text-foreground'>Activity</h2>
          </div>
          <p className='text-sm text-muted-foreground'>0 txn</p>
        </div>

        <div className='mt-6 space-y-2'>
          {previewTransactions.map((transaction) => {
            const isCredit = transaction.amount >= 0

            return (
              <div
                key={transaction.id}
                className='flex items-center justify-between gap-4 rounded-lg border border-border/40 bg-background/75 px-4 py-3'>
                <div className='min-w-0'>
                  <div className='flex items-center gap-2'>
                    <p className='truncate font-display text-base font-semibold text-foreground'>{transaction.name}</p>
                    <span className='rounded-full bg-muted/50 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground'>
                      {transaction.category}
                    </span>
                  </div>
                  <p className='mt-1 text-sm text-muted-foreground'>
                    {transaction.description} · {formatDate(transaction.date)}
                  </p>
                </div>

                <p
                  className={cn('shrink-0 font-display text-base font-semibold', {
                    'text-foreground': isCredit,
                    'text-slate-500': !isCredit
                  })}>
                  {formatSignedCurrency(transaction.amount)}
                </p>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
