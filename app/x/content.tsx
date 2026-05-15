'use client'

import { EvilAreaChart } from '@/components/evilcharts/charts/area-chart'
import type { ChartConfig } from '@/components/evilcharts/ui/chart'
import { FaqsSec } from '@/components/product/faqs'
import { Typewrite } from '@/components/text/typewriter'
import { Button } from '@/components/ui/button'
import { Eyebrow } from '@/components/ui/eyebrow'
import { Input } from '@/components/ui/input'
import { api } from '@/convex/_generated/api'
import { useToggle } from '@/hooks/use-toggle'
import { useFirebaseUser } from '@/lib/firebase/auth'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { useMutation, useQuery } from 'convex/react'
import { SubmitEvent, Suspense, useCallback, useRef, useState } from 'react'
import { ProductList } from '../../components/product/product-list'
import { RecentTxn } from './recent-txn'

const CHART_COLOR = 'var(--foreground)'

type BalancePoint = {
  label: string
  balance: number
}

const ACCOUNT_HISTORY: BalancePoint[] = [{ label: 'May', balance: 0.0 }]

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

const DECIMAL_FORMATTER = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1
})

const formatCurrency = (value: number) => CURRENCY_FORMATTER.format(value)

const formatCompactCurrency = (value: number) => COMPACT_CURRENCY_FORMATTER.format(value)

const formatSignedCurrency = (value: number) => `${value >= 0 ? '+' : '-'}${formatCurrency(Math.abs(value))}`

const formatPercent = (value: number) => `${value >= 0 ? '+' : ''}${DECIMAL_FORMATTER.format(value)}%`

const currentBalance = ACCOUNT_HISTORY[ACCOUNT_HISTORY.length - 1]?.balance ?? 0
const previousBalance = ACCOUNT_HISTORY[ACCOUNT_HISTORY.length - 2]?.balance ?? currentBalance
const balanceChange = currentBalance - previousBalance
const balanceChangePercent = previousBalance === 0 ? 0 : (balanceChange / previousBalance) * 100

const XContent = () => {
  const { user } = useFirebaseUser()
  const accounts = useQuery(api.accounts.q.getAccountsBySub, user?.uid ? { sub: user.uid } : 'skip')
  const stakeIds = accounts?.[0]?.stakes ?? null
  const stakes = useQuery(api.stakes.q.listStakesById, stakeIds ? { ids: stakeIds } : 'skip')
  const updateTitle = useMutation(api.accounts.m.updateTitle)
  const [title, setTitle] = useState('')
  const [error, setError] = useState<Error | null>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const { on: edit, toggle: toggleEdit } = useToggle(false)

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
  }

  const handleEditTitle = useCallback(() => {
    toggleEdit()
    if (titleInputRef.current) {
      titleInputRef.current.focus()
    }
  }, [toggleEdit])

  const handleSetTitle = useCallback(
    async (e: SubmitEvent<HTMLFormElement>) => {
      e.preventDefault()
      if (!user) return
      const trimmedTitle = title.trim()
      if (!trimmedTitle) {
        return
      }

      try {
        await updateTitle({
          id: accounts?.[0]?._id ?? null,
          sub: user.uid,
          title: trimmedTitle
        })
      } catch (e) {
        setError(e as Error)
      } finally {
        toggleEdit()
      }
    },
    [updateTitle, user, setError, title, toggleEdit, accounts]
  )

  return (
    <div className='max-w-6xl space-y-4 md:space-y-8'>
      <section className='space-y-2'>
        <div className='flex gap-4 items-end lg:justify-between'>
          <div className='max-w-2xl space-y-1 h-16 flex flex-col justify-center w-full px-1'>
            <Eyebrow>Active</Eyebrow>
            <div className='flex items-center space-x-4'>
              {edit ? (
                <form onSubmit={handleSetTitle}>
                  <Input
                    autoFocus
                    ref={titleInputRef}
                    placeholder={accounts?.[0]?.title ?? ''}
                    defaultValue={title}
                    onChange={handleTitleChange}
                    className='font-poly font-bold text-lg md:text-xl tracking-tight placeholder:opacity-40 border-none rounded-lg max-w-39 bg-transparent focus-visible:ring-0 outline-none -ml-3'
                  />
                </form>
              ) : accounts?.[0].title ? (
                <Typewrite
                  text={accounts[0].title}
                  showCursor={false}
                  speed={25}
                  className='font-poly font-bold text-foreground text-lg md:text-xl tracking-tight w-36'
                />
              ) : (
                <Icon name='spinner-ring' />
              )}

              <Button type={title ? 'submit' : 'button'} onClick={handleEditTitle} variant='ghost' size='icon'>
                <Icon name={edit ? (title ? 'check' : 'close') : 'cf-pen'} className='size-5 aspect-square' />
              </Button>

              {error && <p className='text-red-500'>{error.message}</p>}
            </div>
          </div>

          <div className='rounded-sm bg-foreground/8 px-4 py-3 text-left lg:text-right min-w-48'>
            <Eyebrow>Stake Total Value</Eyebrow>
            <p className='mt-1 font-display text-sm font-medium text-foreground'>$0</p>
          </div>
        </div>
      </section>

      {!stakes || stakes.length === 0 ? (
        <ProductList />
      ) : (
        <section className='max-h-72 grid xl:grid-cols-[minmax(0,1.7fr)_18rem] gap-6'>
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
                      <p className='mt-2 font-display text-base font-medium text-foreground'>{formatCurrency(0)}</p>
                    </div>
                    <div className='rounded-lg bg-background/80 p-3'>
                      <Eyebrow>Pending</Eyebrow>
                      <p className='mt-2 font-display text-base font-medium text-foreground'>{formatCurrency(0)}</p>
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
            <div className='mt-4 space-y-4'>
              <div className='border-b border-border/40 pb-4'>
                <Eyebrow>Staked</Eyebrow>
                <p className='mt-1 font-display text-xl font-semibold text-foreground'>{formatCurrency(0)}</p>
              </div>
              <div className='border-b border-border/40 pb-4'>
                <Eyebrow>Staked</Eyebrow>
                <p className='mt-1 font-display text-xl font-semibold text-foreground'>{formatCurrency(0)}</p>
              </div>
              <div>
                <Eyebrow>Net Profit</Eyebrow>
                <p className='mt-1 font-display text-xl font-semibold text-foreground'>{formatSignedCurrency(0)}</p>
              </div>
            </div>
          </aside>
        </section>
      )}

      {!stakes || stakes.length === 0 ? <FaqsSec /> : <RecentTxn txns={[]} balance={0} />}
    </div>
  )
}

export const Content = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <XContent />
  </Suspense>
)
