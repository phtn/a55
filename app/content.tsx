'use client'

import { EvilAreaChart } from '@/components/evilcharts/charts/area-chart'
import type { ChartConfig } from '@/components/evilcharts/ui/chart'
import type { ETF } from '@/lib/tikr/types'
import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'

const PixelGrid = dynamic(() => import('three-px-react').then((mod) => mod.PixelGrid), {
  ssr: false
})

const POSITIVE_CHART_COLOR = 'var(--foreground)'
const NEGATIVE_CHART_COLOR = 'var(--muted-foreground)'

interface ContentProps {
  page?: string
}

type HistoryPoint = Record<string, string | number> & {
  label: string
  price: number
}

type OverviewQuote = ETF['last'][number] & {
  history: HistoryPoint[]
}

const EMPTY_HISTORY: HistoryPoint[] = []

const getPriceChartConfig = (label: string, positive: boolean) =>
  ({
    price: {
      label,
      colors: {
        light: [positive ? POSITIVE_CHART_COLOR : NEGATIVE_CHART_COLOR],
        dark: [positive ? POSITIVE_CHART_COLOR : NEGATIVE_CHART_COLOR]
      }
    }
  }) satisfies ChartConfig

const formatPrice = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)

const formatPercent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`

const formatUpdateTime = (timestamp: number) => {
  const normalized = timestamp > 1_000_000_000_000 ? timestamp : timestamp * 1000
  const date = new Date(normalized)

  if (Number.isNaN(date.getTime())) {
    return 'Unknown'
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

const toHistoryPointLabel = (point: ETF['last'][number]['ts'][number], index: number) =>
  point.label || point.minute || point.date || `Point ${index + 1}`

export const Content = ({ page }: ContentProps) => {
  const [data, setData] = useState<ETF | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [requestKey, setRequestKey] = useState(0)
  const [activeSymbol, setActiveSymbol] = useState('')

  useEffect(() => {
    if (page === 'watchlist') {
      return
    }

    const controller = new AbortController()

    const load = async () => {
      setStatus('loading')
      setError(null)

      try {
        const response = await fetch('/api/tikr', {
          signal: controller.signal
        })

        if (!response.ok) {
          throw new Error((await response.text()) || 'Failed to load overview data')
        }

        const nextData = (await response.json()) as ETF
        setData(nextData)
        setActiveSymbol((current) =>
          nextData.last.some((quote) => quote.symbol === current) ? current : (nextData.last[0]?.symbol ?? '')
        )
        setStatus('ready')
      } catch (nextError) {
        if (controller.signal.aborted) {
          return
        }

        setStatus('error')
        setError(nextError instanceof Error ? nextError.message : 'Unknown error')
      }
    }

    void load()

    return () => controller.abort()
  }, [page, requestKey])

  const quotes = useMemo<OverviewQuote[]>(
    () =>
      (data?.last ?? []).map((quote) => ({
        ...quote,
        history: quote.ts.map((point, index) => ({
          label: toHistoryPointLabel(point, index),
          price: point.close
        }))
      })),
    [data]
  )

  if (page === 'watchlist') {
    return (
      <div className='w-full max-w-4xl space-y-4'>
        <p className='text-sm font-mono text-muted-foreground'>Watchlist is not wired yet.</p>
        <div className='rounded-2xl border border-border/50 bg-muted/20 p-6'>
          <PixelGrid animation='checkerboard' color='#AAAAAA' duration={1800} className='h-12 w-12' />
          <p className='mt-4 max-w-md text-sm leading-6 text-muted-foreground'>
            The overview page is now using live Tikr data. Watchlist can be wired next once you decide whether it should
            reuse these instruments or persist a user-specific set.
          </p>
        </div>
      </div>
    )
  }

  const activeQuote = quotes.find((quote) => quote.symbol === activeSymbol) ?? quotes[0] ?? null

  return (
    <div className='w-full max-w-7xl space-y-6'>
      <div className='flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between'>
        <div className='space-y-1'>
          <p className='text-sm font-mono text-muted-foreground'>
            Live ETF snapshots from Tikr, rendered with evilcharts.
          </p>
          <p className='text-[10px] font-mono uppercase tracking-[0.24em] text-muted-foreground'>
            {quotes.length} instruments
          </p>
        </div>
        <button
          type='button'
          onClick={() => setRequestKey((value) => value + 1)}
          className='inline-flex h-9 items-center justify-center rounded-full border border-border/60 bg-background px-4 text-xs font-mono text-foreground transition-colors hover:bg-muted/40'>
          Refresh
        </button>
      </div>

      {status === 'loading' && (
        <div className='rounded-2xl border border-border/50 bg-background/70 p-4 sm:p-5'>
          <div className='flex items-center justify-between gap-4'>
            <div className='space-y-2'>
              <div className='h-3 w-28 rounded-full bg-muted/60' />
              <div className='h-8 w-40 rounded-full bg-muted/60' />
            </div>
            <PixelGrid animation='snake' color='#AAAAAA' duration={1200} />
          </div>
          <div className='mt-4 h-72'>
            <EvilAreaChart
              data={EMPTY_HISTORY}
              chartConfig={getPriceChartConfig('Loading', true)}
              xDataKey='label'
              yDataKey='price'
              className='h-full w-full min-h-0'
              isLoading
              loadingPoints={16}
              hideLegend
              hideCartesianGrid
            />
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className='rounded-2xl border border-destructive/30 bg-destructive/5 p-5'>
          <p className='font-medium text-foreground'>Failed to load Tikr overview</p>
          <p className='mt-1 text-sm text-muted-foreground'>{error}</p>
        </div>
      )}

      {status === 'ready' && !activeQuote && (
        <div className='rounded-2xl border border-border/50 bg-muted/20 p-5'>
          <p className='font-medium text-foreground'>Tikr returned no instruments.</p>
          <p className='mt-1 text-sm text-muted-foreground'>Check the configured ids or the upstream response shape.</p>
        </div>
      )}

      {status === 'ready' && activeQuote && (
        <>
          <div className='grid grid-cols-1 xl:grid-cols-[minmax(0,1.8fr)_20rem] gap-3'>
            <div className='rounded-lg bg-border/5 p-4 sm:p-5'>
              <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                <div className='space-y-1'>
                  <p className='text-[10px] font-mono uppercase tracking-[0.24em] text-muted-foreground'>
                    Overview focus
                  </p>
                  <div className='flex items-end gap-2'>
                    <h2 className='font-display text-3xl font-semibold tracking-tight text-foreground'>
                      {activeQuote.symbol}
                    </h2>
                    <span className='pb-1 text-sm text-muted-foreground'>{activeQuote.companyName}</span>
                  </div>
                </div>

                <div className='text-left sm:text-right'>
                  <p className='text-2xl font-mono font-semibold text-foreground ticker-font'>
                    {formatPrice(activeQuote.latestPrice)}
                  </p>
                  <p className={`text-sm font-mono ${activeQuote.change >= 0 ? 'text-foreground' : 'text-slate-500'}`}>
                    {formatPercent(activeQuote.changePercent)}
                  </p>
                </div>
              </div>

              <div className='mt-4 h-72'>
                <EvilAreaChart
                  data={activeQuote.history}
                  chartConfig={getPriceChartConfig(`${activeQuote.symbol} close`, activeQuote.change >= 0)}
                  xDataKey='label'
                  yDataKey='price'
                  className='h-full w-full min-h-0'
                  chartProps={{
                    margin: {
                      top: 10,
                      right: 10,
                      bottom: 0,
                      left: 6
                    }
                  }}
                  curveType='monotone'
                  strokeVariant='solid'
                  areaVariant='gradient'
                  showBrush
                  brushHeight={44}
                  brushFormatLabel={(value) => String(value)}
                  tooltipVariant='frosted-glass'
                  tooltipRoundness='xl'
                  xAxisProps={{
                    tickMargin: 10
                  }}
                  yAxisProps={{
                    tickFormatter: (value) => formatPrice(Number(value))
                  }}
                />
              </div>
            </div>
            <div className='rounded-xl bg-border/5 p-4 sm:p-5'>
              <div className='grid grid-cols-2 gap-3'>
                <div className='rounded-xl bg-background/80 p-3'>
                  <p className='text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground'>Previous</p>
                  <p className='mt-2 text-sm font-medium text-foreground'>{formatPrice(activeQuote.previousClose)}</p>
                </div>
                <div className='rounded-xl bg-background/80 p-3'>
                  <p className='text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground'>Change</p>
                  <p className='mt-2 text-sm font-medium text-foreground'>{formatPrice(activeQuote.change)}</p>
                </div>
                <div className='rounded-xl bg-background/80 p-3'>
                  <p className='text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground'>Source</p>
                  <p className='mt-2 text-sm font-medium text-foreground'>{activeQuote.latestSource}</p>
                </div>
                <div className='rounded-xl bg-background/80 p-3'>
                  <p className='text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground'>Updated</p>
                  <p className='mt-2 text-sm font-medium text-foreground'>
                    {formatUpdateTime(activeQuote.latestUpdate)}
                  </p>
                </div>
              </div>

              <div className='mt-4 space-y-2'>
                <p className='text-[10px] font-mono uppercase tracking-[0.24em] text-muted-foreground'>ETFs</p>
                <div className='flex flex-wrap gap-2'>
                  {quotes.map((quote) => (
                    <button
                      key={`${quote.cid}-${quote.tid}`}
                      type='button'
                      aria-pressed={activeQuote.symbol === quote.symbol}
                      onClick={() => setActiveSymbol(quote.symbol)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-mono transition-colors ${
                        activeQuote.symbol === quote.symbol
                          ? 'border-y/30 bg-primary/e0 text-primary'
                          : 'border-border/50 bg-background/80 text-muted-foreground hover:text-foreground'
                      }`}>
                      {quote.symbol}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3'>
            {quotes.map((quote) => {
              const isPositive = quote.change >= 0

              return (
                <button
                  key={`${quote.cid}-${quote.tid}`}
                  type='button'
                  onClick={() => setActiveSymbol(quote.symbol)}
                  onMouseEnter={() => setActiveSymbol(quote.symbol)}
                  className={`glass-panel-hover rounded-xl p-4 text-left transition-colors ${
                    activeQuote.symbol === quote.symbol ? 'ring-1 ring-primary/25 bg-primary/4' : ''
                  }`}>
                  <div className='flex items-start justify-between gap-3'>
                    <div className='min-w-0'>
                      <p className='text-sm font-semibold text-foreground'>{quote.symbol}</p>
                      <p className='truncate text-[11px] text-muted-foreground'>{quote.companyName}</p>
                    </div>
                    <span className='rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground'>
                      {quote.fc ? 'FC' : 'LIVE'}
                    </span>
                  </div>

                  <div className='mt-4 h-24'>
                    <EvilAreaChart
                      data={quote.history}
                      chartConfig={getPriceChartConfig(`${quote.symbol} close`, isPositive)}
                      xDataKey='label'
                      yDataKey='price'
                      className='h-full w-full min-h-0'
                      chartProps={{
                        margin: {
                          top: 4,
                          right: 4,
                          bottom: 4,
                          left: 4
                        }
                      }}
                      curveType='bump'
                      strokeVariant='solid'
                      areaVariant='gradient'
                      hideTooltip
                      hideLegend
                      hideCartesianGrid
                      hideCursorLine
                    />
                  </div>

                  <div className='mt-4 flex items-end justify-between gap-3'>
                    <p className='text-lg font-mono font-semibold text-foreground ticker-font'>
                      {formatPrice(quote.latestPrice)}
                    </p>
                    <span className={`text-xs font-mono ${isPositive ? 'text-foreground' : 'text-slate-500'}`}>
                      {formatPercent(quote.changePercent)}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
