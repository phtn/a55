'use client'

import { EvilAreaChart } from '@/components/evilcharts/charts/area-chart'
import type { ChartConfig } from '@/components/evilcharts/ui/chart'
import type { StockPriceResponse } from '@/lib/tikr/types'
import Link from 'next/link'
import { startTransition, useEffect, useMemo, useState } from 'react'

const POSITIVE_CHART_COLOR = 'var(--foreground)'
const NEGATIVE_CHART_COLOR = 'var(--muted-foreground)'
const DEFAULT_CURRENCY_CODE = 'USD'
const RECENT_PRICE_POINTS = 252

type PriceHistoryPoint = {
  date: string
  label: string
  close: number
  volume: number
}

const EMPTY_HISTORY: PriceHistoryPoint[] = []

const getPriceChartConfig = (label: string, positive: boolean) =>
  ({
    close: {
      label,
      colors: {
        light: [positive ? POSITIVE_CHART_COLOR : NEGATIVE_CHART_COLOR],
        dark: [positive ? POSITIVE_CHART_COLOR : NEGATIVE_CHART_COLOR]
      }
    }
  }) satisfies ChartConfig

const toNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

const formatCurrency = (value: number, currencyCode: string) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode || DEFAULT_CURRENCY_CODE,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)

const formatCompactNumber = (value: number) =>
  new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: value >= 1_000_000_000 ? 2 : 1
  }).format(value)

const formatPercentValue = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`

const formatDateLabel = (value: string) => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

const formatDateTime = (value: string) => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const readApiError = async (response: Response, fallbackMessage: string) => {
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    const payload = (await response.json()) as { error?: string }
    return payload.error || fallbackMessage
  }

  return (await response.text()) || fallbackMessage
}

interface CompanyPriceClientProps {
  symbol: string
  cid: number | null
  tid: number | null
}

export const CompanyPriceClient = ({ symbol, cid, tid }: CompanyPriceClientProps) => {
  const [data, setData] = useState<StockPriceResponse | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [requestKey, setRequestKey] = useState(0)
  const missingIdentifiers = !cid || !tid

  useEffect(() => {
    if (missingIdentifiers) {
      return
    }

    const controller = new AbortController()

    const load = async () => {
      setStatus('loading')
      setError(null)

      try {
        const response = await fetch('/api/tikr-price', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            cid,
            tid
          }),
          signal: controller.signal
        })

        if (!response.ok) {
          throw new Error(await readApiError(response, 'Failed to load company price data'))
        }

        const nextData = (await response.json()) as StockPriceResponse
        setData(nextData)
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
  }, [cid, tid, missingIdentifiers, requestKey])

  const company = data?.company[0] ?? null
  const currencyCode = data?.isoCode || company?.isocode || DEFAULT_CURRENCY_CODE
  const latestPrice = toNumber(data?.last.c)
  const previousClose = toNumber(data?.last.pc)
  const trendPercent = toNumber(data?.last.tr)
  const marketCap = toNumber(company?.marketcap ?? data?.last.mc)
  const enterpriseValue = toNumber(company?.tev ?? data?.last.tev)
  const sharesOutstanding = toNumber(company?.sharesoutstanding)
  const isPositive = (trendPercent ?? 0) >= 0

  const history = useMemo<PriceHistoryPoint[]>(
    () =>
      (data?.price ?? [])
        .map((point) => ({
          date: point.d,
          label: formatDateLabel(point.d),
          close: toNumber(point.c) ?? 0,
          volume: toNumber(point.v) ?? 0
        }))
        .filter((point) => Number.isFinite(point.close)),
    [data]
  )

  const chartData = useMemo(() => history.slice(-RECENT_PRICE_POINTS), [history])
  const recentFinancials = useMemo(() => (data?.fin ?? []).slice(0, 6), [data])

  return (
    <div className='mx-auto max-w-7xl space-y-6'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
        <div className='space-y-1'>
          <p className='text-[10px] font-mono uppercase tracking-[0.24em] text-muted-foreground'>Company price</p>
          <div className='flex flex-wrap items-end gap-3'>
            <h1 className='font-display text-3xl font-semibold tracking-tight text-foreground'>{symbol}</h1>
            <span className='pb-1 text-sm text-muted-foreground'>{company?.tickersymbol || company?.currencyname || 'Tikr feed'}</span>
          </div>
        </div>

        <div className='flex items-center gap-3'>
          <button
            type='button'
            onClick={() => startTransition(() => setRequestKey((value) => value + 1))}
            className='inline-flex h-9 items-center justify-center rounded-full border border-border/60 bg-background px-4 text-xs font-mono text-foreground transition-colors hover:bg-muted/40'>
            Refresh
          </button>
          <Link href='/' className='text-sm font-mono text-muted-foreground transition-colors hover:text-foreground'>
            Back to overview
          </Link>
        </div>
      </div>

      {missingIdentifiers && (
        <div className='rounded-2xl border border-border/50 bg-muted/20 p-5'>
          <p className='font-medium text-foreground'>Missing company identifiers</p>
          <p className='mt-1 text-sm text-muted-foreground'>
            Open a company from the overview or movers list first so the route includes `cid` and `tid`.
          </p>
        </div>
      )}

      {status === 'loading' && (
        <div className='rounded-2xl border border-border/50 bg-background/70 p-4 sm:p-5'>
          <div className='space-y-2'>
            <div className='h-3 w-28 rounded-full bg-muted/60' />
            <div className='h-8 w-40 rounded-full bg-muted/60' />
          </div>
          <div className='mt-4 h-80'>
            <EvilAreaChart
              data={EMPTY_HISTORY}
              chartConfig={getPriceChartConfig(`${symbol} close`, true)}
              xDataKey='label'
              yDataKey='close'
              className='h-full w-full min-h-0'
              isLoading
              loadingPoints={20}
              hideLegend
              hideCartesianGrid
            />
          </div>
        </div>
      )}

      {!missingIdentifiers && status === 'error' && (
        <div className='rounded-2xl border border-destructive/30 bg-destructive/5 p-5'>
          <p className='font-medium text-foreground'>Failed to load company price data</p>
          <p className='mt-1 text-sm text-muted-foreground'>{error}</p>
        </div>
      )}

      {!missingIdentifiers && status === 'ready' && data && (
        <>
          <div className='grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.9fr)_22rem]'>
            <div className='rounded-lg bg-border/5 p-4 sm:p-5'>
              <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                <div className='space-y-1'>
                  <p className='text-[10px] font-mono uppercase tracking-[0.24em] text-muted-foreground'>
                    Recent price history
                  </p>
                  <div className='flex items-end gap-2'>
                    <h2 className='font-display text-3xl font-semibold tracking-tight text-foreground'>
                      {latestPrice !== null ? formatCurrency(latestPrice, currencyCode) : 'N/A'}
                    </h2>
                    {trendPercent !== null && (
                      <span className={`pb-1 text-sm font-mono ${isPositive ? 'text-foreground' : 'text-slate-500'}`}>
                        {formatPercentValue(trendPercent)}
                      </span>
                    )}
                  </div>
                </div>

                <div className='text-left sm:text-right'>
                  <p className='text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground'>Showing</p>
                  <p className='mt-2 text-sm text-foreground'>
                    {chartData.length} of {data.numPrice.toLocaleString()} price points
                  </p>
                </div>
              </div>

              <div className='mt-4 h-80'>
                <EvilAreaChart
                  data={chartData}
                  chartConfig={getPriceChartConfig(`${symbol} close`, isPositive)}
                  xDataKey='label'
                  yDataKey='close'
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
                    tickFormatter: (value) => formatCurrency(Number(value), currencyCode)
                  }}
                />
              </div>
            </div>

            <div className='rounded-xl bg-border/5 p-4 sm:p-5'>
              <div className='grid grid-cols-2 gap-3'>
                <div className='rounded-xl bg-background/80 p-3'>
                  <p className='text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground'>Previous</p>
                  <p className='mt-2 text-sm font-medium text-foreground'>
                    {previousClose !== null ? formatCurrency(previousClose, currencyCode) : 'N/A'}
                  </p>
                </div>
                <div className='rounded-xl bg-background/80 p-3'>
                  <p className='text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground'>Currency</p>
                  <p className='mt-2 text-sm font-medium text-foreground'>{currencyCode}</p>
                </div>
                <div className='rounded-xl bg-background/80 p-3'>
                  <p className='text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground'>Market Cap</p>
                  <p className='mt-2 text-sm font-medium text-foreground'>
                    {marketCap !== null ? formatCompactNumber(marketCap) : 'N/A'}
                  </p>
                </div>
                <div className='rounded-xl bg-background/80 p-3'>
                  <p className='text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground'>TEV</p>
                  <p className='mt-2 text-sm font-medium text-foreground'>
                    {enterpriseValue !== null ? formatCompactNumber(enterpriseValue) : 'N/A'}
                  </p>
                </div>
                <div className='rounded-xl bg-background/80 p-3'>
                  <p className='text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground'>Shares Out</p>
                  <p className='mt-2 text-sm font-medium text-foreground'>
                    {sharesOutstanding !== null ? formatCompactNumber(sharesOutstanding) : 'N/A'}
                  </p>
                </div>
                <div className='rounded-xl bg-background/80 p-3'>
                  <p className='text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground'>Pricing Date</p>
                  <p className='mt-2 text-sm font-medium text-foreground'>
                    {company?.pricingdate ? formatDateTime(company.pricingdate) : 'N/A'}
                  </p>
                </div>
              </div>

              <div className='mt-4 rounded-xl bg-background/80 p-3'>
                <p className='text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground'>Identifiers</p>
                <div className='mt-2 grid grid-cols-2 gap-2 text-sm text-foreground'>
                  <span className='font-mono'>CID {cid}</span>
                  <span className='font-mono'>TID {tid}</span>
                </div>
              </div>
            </div>
          </div>

          <div className='rounded-xl bg-border/5 p-4 sm:p-5'>
            <div className='space-y-1'>
              <p className='text-[10px] font-mono uppercase tracking-[0.24em] text-muted-foreground'>Financial snapshot</p>
              <h2 className='font-display text-2xl font-semibold tracking-tight text-foreground'>Recent fundamentals</h2>
            </div>

            <div className='mt-4 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3'>
              {recentFinancials.length > 0 ? (
                recentFinancials.map((item, index) => (
                  <div key={`${item.dataitemid}-${index}`} className='rounded-xl bg-background/80 p-3'>
                    <p className='text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground'>
                      FY{item.fiscalyear} Q{item.fiscalquarter}
                    </p>
                    <p className='mt-2 text-sm font-medium text-foreground'>{item.dataitemname}</p>
                    <p className='mt-1 text-sm text-muted-foreground'>{item.dataitemvalue || 'N/A'}</p>
                  </div>
                ))
              ) : (
                <div className='rounded-xl bg-background/80 p-3 text-sm text-muted-foreground'>
                  No financial snapshot rows were returned for this symbol.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
