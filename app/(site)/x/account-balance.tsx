'use client'

import { EvilAreaChart } from '@/components/evilcharts/charts/area-chart'
import { ChartConfig } from '@/components/evilcharts/ui/chart'
import { Button } from '@/components/ui/button'
import { Eyebrow } from '@/components/ui/eyebrow'
import { Doc } from '@/convex/_generated/dataModel'
import {
  formatCompactCurrency,
  formatCurrency,
  formatPercentValue,
  formatSignedCurrency
} from '@/lib/helpers/formatters'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'

interface AccountBalanceProps {
  stakes: Doc<'stakes'>[]
  history: Doc<'history'>[] | null
  toggleProductList: VoidFunction
}

const CHART_COLOR = 'var(--foreground)'
const BALANCE_CHART_CONFIG = {
  balance: {
    label: 'Balance',
    colors: {
      light: [CHART_COLOR],
      dark: [CHART_COLOR]
    }
  }
} satisfies ChartConfig

export const AccountBalance = ({ stakes, history, toggleProductList }: AccountBalanceProps) => {
  const latestHistory = history?.[0] ?? null
  const latestChange = latestHistory?.change ?? 0
  const latestChangePct = latestHistory?.changePct ?? 0
  const balanceHistory = history?.map((entry) => entry.summary) ?? []

  return (
    <section className='min-h-72 grid xl:grid-cols-[minmax(0,1.7fr)_18rem] gap-6'>
      <div className='rounded-md border border-border/50 bg-border/4 p-2 sm:p-4 md:p-6'>
        <div className='flex flex-col gap-6'>
          <div className='flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between'>
            <div className='space-y-1'>
              {stakes && (
                <div className='inline-flex items-center gap-1 rounded-full bg-background/80 p-1 text-[10px] uppercase tracking-[0.2em] text-foreground/55 w-full'>
                  <span className='size-2 rounded-full bg-foreground/70' />
                  <div className='flex items-center justify-between w-full'>
                    <Eyebrow className='flex w-full'>Active</Eyebrow>
                    <Eyebrow className='flex-1 md:hidden'>This Month</Eyebrow>
                  </div>
                </div>
              )}

              <div className='flex items-center justify-between md:flex-col'>
                <div className='flex items-center'>
                  <p className='font-display text-4xl font-semibold tracking-tight text-foreground md:text-4xl'>
                    {formatCurrency(stakes.reduce((a, s) => a + s.amount, 0))}
                  </p>
                </div>
                {history !== null && (
                  <div className='flex md:flex-row flex-col items-center text-sm md:p-1 px-1.5 md:space-x-4 md:mt-1 justify-end'>
                    <div
                      className={cn('flex items-center justify-end w-full font-display text-sm', {
                        'text-foreground': latestChange >= 0,
                        'text-slate-500': latestChange < 0
                      })}>
                      {formatSignedCurrency(latestChange)}
                    </div>

                    <div className='flex items-center justify-center space-x-1 font-display'>
                      <Icon name={latestChange >= 0 ? 'trending-up' : 'trending-down'} className='size-4' />
                      <span className='text-sm'>{formatPercentValue(latestChangePct)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {stakes && (
              <div className='grid md:grid-cols-8 grid-cols-4 gap-1 md:gap-2 sm:min-w-64 '>
                {stakes.slice(0, 2).map((stake) => (
                  <div key={stake._id} className='rounded-lg bg-background/80 p-2 md:text-center'>
                    <Eyebrow>{stake.title.split(' ').pop()}</Eyebrow>
                    <p className='md:mt-2 font-display text-base font-medium text-foreground tracking-tight'>
                      {formatCompactCurrency(stake.amount)}
                    </p>
                  </div>
                ))}
                <div className='rounded-lg bg-background/80 p-2 text-center'>
                  <Eyebrow>Avbl</Eyebrow>
                  <p className='md:mt-2 font-display text-base font-medium text-foreground tracking-tight'>
                    {formatCompactCurrency(
                      stakes.reduce((acc, stake) => {
                        if (!stake.isStaked) acc += stake.amount
                        return acc
                      }, 0)
                    )}
                  </p>
                </div>
                <div className='rounded-lg bg-background/80 p-2 text-center'>
                  <Eyebrow>Hold</Eyebrow>
                  <p className='md:mt-2 font-display text-base font-medium text-foreground tracking-tight'>
                    {formatCompactCurrency(0)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {history !== null && (
            <div className='h-64' data-accounts-balance-chart>
              <EvilAreaChart
                data={balanceHistory}
                chartConfig={BALANCE_CHART_CONFIG}
                xDataKey='label'
                yDataKey='balance'
                className='h-full w-full min-h-0 aspect-auto!'
                chartProps={{
                  margin: {
                    top: 8,
                    right: 8,
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

      <aside className='rounded-md border border-border/50 bg-background/70 p-2 md:p-5'>
        <div className='mt-1 space-y-4 relative'>
          <div className='border-b border-border/40 pb-4'>
            <Eyebrow>Total Stakes</Eyebrow>
            <div className='flex items-center justify-between w-full'>
              <p className='mt-1 font-display text-xl font-semibold text-foreground'>{stakes.length}</p>
            </div>
          </div>
          <Button
            onClick={toggleProductList}
            variant='secondary'
            size='sm'
            className='absolute top-0 right-0 rounded-sm '>
            <Icon name='add' className='size-3.5' />
            <span className='text-base'>Stake</span>
          </Button>
          <div className='border-b border-border/40 pb-4'>
            <Eyebrow>Active Stakes</Eyebrow>
            <p className='mt-1 font-display text-xl font-semibold text-foreground'>
              {stakes.filter((stake) => stake.isActive).length}
            </p>
          </div>
          <div>
            <Eyebrow>Stake Value</Eyebrow>
            <p className='mt-1 font-display text-xl font-semibold text-foreground'>
              {formatCurrency(stakes.reduce((acc, stake) => acc + stake.amount, 0))}
            </p>
          </div>
        </div>
      </aside>
    </section>
  )
}
