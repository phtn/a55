'use client'

import { EvilAreaChart } from '@/components/evilcharts/charts/area-chart'
import type { ChartConfig } from '@/components/evilcharts/ui/chart'
import { Eyebrow } from '@/components/ui/eyebrow'
import { Title } from '@/components/ui/title'
import Link from 'next/link'
import { startTransition, useEffect, useMemo, useState } from 'react'

const POSITIVE_CHART_COLOR = 'var(--foreground)'
const NEGATIVE_CHART_COLOR = 'var(--muted-foreground)'
const DEFAULT_CURRENCY_CODE = 'USD'
const HISTORY_LOOKBACK_DAYS = 400
const RECENT_PRICE_POINTS = 252

type AsyncStatus = 'loading' | 'ready' | 'error'

type PriceHistoryPoint = {
  date: string
  label: string
  close: number
  volume: number
}

interface Yf2Response<T> {
  operation: string
  data: T
}

interface Yf2RequestBody {
  operation: string
  symbol: string
  options?: Record<string, unknown>
}

interface CompanyQuoteApi {
  symbol: string
  currency?: string
  shortName?: string
  longName?: string
  quoteType?: string
  fullExchangeName?: string
  quoteSourceName?: string
  regularMarketPrice?: number
  regularMarketPreviousClose?: number
  regularMarketChange?: number
  regularMarketChangePercent?: number
  regularMarketTime?: string
  regularMarketVolume?: number
  marketCap?: number
}

interface CompanyChartApiQuote {
  date: string
  close: number | null
  volume: number | null
}

interface CompanyChartApiData {
  meta: {
    symbol: string
    currency?: string
    shortName?: string
    longName?: string
    fullExchangeName?: string
    regularMarketPrice?: number
    regularMarketTime?: string
    previousClose?: number
    fiftyTwoWeekHigh?: number
    fiftyTwoWeekLow?: number
  }
  quotes: CompanyChartApiQuote[]
}

interface CompanySummaryPrice {
  marketState?: string
  quoteSourceName?: string
  quoteType?: string
  regularMarketTime?: string
  regularMarketOpen?: number
  regularMarketDayHigh?: number
  regularMarketDayLow?: number
  regularMarketVolume?: number
  averageDailyVolume10Day?: number
  averageDailyVolume3Month?: number
  marketCap?: number
  currency?: string
}

interface CompanySummaryDetail {
  beta?: number
  trailingPE?: number
  forwardPE?: number
  dividendYield?: number
  exDividendDate?: string
  fiftyDayAverage?: number
  twoHundredDayAverage?: number
  fiftyTwoWeekLow?: number
  fiftyTwoWeekHigh?: number
  regularMarketPreviousClose?: number
}

interface CompanyDefaultKeyStatistics {
  enterpriseValue?: number
  sharesOutstanding?: number
  priceToBook?: number
  trailingEps?: number
  forwardEps?: number
  enterpriseToRevenue?: number
  enterpriseToEbitda?: number
  lastFiscalYearEnd?: string
  mostRecentQuarter?: string
}

interface CompanyFinancialData {
  currentPrice?: number
  targetMeanPrice?: number
  recommendationKey?: string
  numberOfAnalystOpinions?: number
  totalCash?: number
  totalDebt?: number
  totalRevenue?: number
  ebitda?: number
  operatingCashflow?: number
  freeCashflow?: number
  revenueGrowth?: number
  earningsGrowth?: number
  grossMargins?: number
  operatingMargins?: number
  profitMargins?: number
  returnOnAssets?: number
  returnOnEquity?: number
  financialCurrency?: string | null
}

interface CompanyAssetProfile {
  sector?: string
  industry?: string
  website?: string
  fullTimeEmployees?: number
  longBusinessSummary?: string
}

interface CompanyEarningsItem {
  date: string
  fiscalQuarter?: string
  revenue?: number
  earnings?: number
  profitMargin?: number
}

interface CompanyEarningsSummary {
  financialsChart?: {
    quarterly?: CompanyEarningsItem[]
  }
}

interface CompanySummaryApi {
  price?: CompanySummaryPrice
  summaryDetail?: CompanySummaryDetail
  defaultKeyStatistics?: CompanyDefaultKeyStatistics
  financialData?: CompanyFinancialData
  assetProfile?: CompanyAssetProfile
  earnings?: CompanyEarningsSummary
}

interface CompanyPageData {
  quote: CompanyQuoteApi
  chart: CompanyChartApiData
  summary: CompanySummaryApi
}

interface CompanyPriceClientProps {
  symbol: string
}

type FinancialMetric = {
  label: string
  value: string
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

const getHistoryStart = () => {
  const start = new Date()
  start.setDate(start.getDate() - HISTORY_LOOKBACK_DAYS)
  return start.toISOString().slice(0, 10)
}

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

const formatCompactCurrency = (value: number, currencyCode: string) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode || DEFAULT_CURRENCY_CODE,
    notation: 'compact',
    maximumFractionDigits: value >= 1_000_000_000 ? 2 : 1
  }).format(value)

const formatCompactNumber = (value: number) =>
  new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: value >= 1_000_000_000 ? 2 : 1
  }).format(value)

const formatPercentValue = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`

const formatRatioPercentValue = (value: number) => `${value >= 0 ? '+' : ''}${(value * 100).toFixed(2)}%`

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

const formatNullableCurrency = (value: number | null, currencyCode: string) =>
  value === null ? 'N/A' : formatCurrency(value, currencyCode)

const formatNullableCompactCurrency = (value: number | null, currencyCode: string) =>
  value === null ? 'N/A' : formatCompactCurrency(value, currencyCode)

const formatNullableCompactNumber = (value: number | null) => (value === null ? 'N/A' : formatCompactNumber(value))

const formatNullableRatioPercent = (value: number | null) => (value === null ? 'N/A' : formatRatioPercentValue(value))

const formatNullableDate = (value: string | undefined) => (value ? formatDateTime(value) : 'N/A')

const formatRecommendation = (value: string | undefined) => {
  if (!value) {
    return ''
  }

  return value.split('_').join(' ')
}

const readApiError = async (response: Response, fallbackMessage: string) => {
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    const payload = (await response.json()) as { error?: string }
    return payload.error || fallbackMessage
  }

  return (await response.text()) || fallbackMessage
}

const fetchYf2 = async <T,>(request: Yf2RequestBody, signal: AbortSignal) => {
  const response = await fetch('/api/yf2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request),
    signal
  })

  if (!response.ok) {
    throw new Error(await readApiError(response, `Failed to load ${request.operation} data`))
  }

  const payload = (await response.json()) as Yf2Response<T>
  return payload.data
}

export const CompanyPriceClient = ({ symbol }: CompanyPriceClientProps) => {
  const [data, setData] = useState<CompanyPageData | null>(null)
  const [status, setStatus] = useState<AsyncStatus>('loading')
  const [error, setError] = useState<string | null>(null)
  const [requestKey, setRequestKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    const load = async () => {
      setStatus('loading')
      setError(null)

      try {
        const [quote, chart, summary] = await Promise.all([
          fetchYf2<CompanyQuoteApi>(
            {
              operation: 'quote',
              symbol,
              options: {
                fields: [
                  'symbol',
                  'currency',
                  'shortName',
                  'longName',
                  'quoteType',
                  'fullExchangeName',
                  'quoteSourceName',
                  'regularMarketPrice',
                  'regularMarketPreviousClose',
                  'regularMarketChange',
                  'regularMarketChangePercent',
                  'regularMarketTime',
                  'regularMarketVolume',
                  'marketCap'
                ]
              }
            },
            controller.signal
          ),
          fetchYf2<CompanyChartApiData>(
            {
              operation: 'chart',
              symbol,
              options: {
                period1: getHistoryStart(),
                interval: '1d'
              }
            },
            controller.signal
          ),
          fetchYf2<CompanySummaryApi>(
            {
              operation: 'quoteSummary',
              symbol,
              options: {
                modules: ['price', 'summaryDetail', 'defaultKeyStatistics', 'financialData', 'assetProfile', 'earnings']
              }
            },
            controller.signal
          )
        ])

        if (controller.signal.aborted) {
          return
        }

        setData({ quote, chart, summary })
        setStatus('ready')
      } catch (nextError) {
        if (controller.signal.aborted) {
          return
        }

        setData(null)
        setStatus('error')
        setError(nextError instanceof Error ? nextError.message : 'Unknown error')
      }
    }

    void load()

    return () => controller.abort()
  }, [requestKey, symbol])

  const currencyCode =
    data?.quote.currency ||
    data?.summary.price?.currency ||
    data?.chart.meta.currency ||
    data?.summary.financialData?.financialCurrency ||
    DEFAULT_CURRENCY_CODE
  const financialCurrencyCode = data?.summary.financialData?.financialCurrency || currencyCode
  const companyName =
    data?.quote.longName || data?.quote.shortName || data?.chart.meta.longName || data?.chart.meta.shortName || symbol
  const latestPrice = toNumber(
    data?.quote.regularMarketPrice ?? data?.summary.financialData?.currentPrice ?? data?.chart.meta.regularMarketPrice
  )
  const previousClose = toNumber(
    data?.quote.regularMarketPreviousClose ??
      data?.summary.summaryDetail?.regularMarketPreviousClose ??
      data?.chart.meta.previousClose
  )
  const priceChange =
    latestPrice !== null && previousClose !== null
      ? latestPrice - previousClose
      : toNumber(data?.quote.regularMarketChange)
  const trendPercent = toNumber(data?.quote.regularMarketChangePercent)
  const marketCap = toNumber(data?.quote.marketCap ?? data?.summary.price?.marketCap)
  const enterpriseValue = toNumber(data?.summary.defaultKeyStatistics?.enterpriseValue)
  const sharesOutstanding = toNumber(data?.summary.defaultKeyStatistics?.sharesOutstanding)
  const isPositive = (trendPercent ?? 0) >= 0
  const quoteType = data?.quote.quoteType || data?.summary.price?.quoteType || 'Quote'
  const exchangeName = data?.quote.fullExchangeName || data?.chart.meta.fullExchangeName || 'Yahoo Finance'
  const sourceName = data?.quote.quoteSourceName || data?.summary.price?.quoteSourceName || exchangeName
  const latestUpdate =
    data?.quote.regularMarketTime || data?.summary.price?.regularMarketTime || data?.chart.meta.regularMarketTime
  const sector = data?.summary.assetProfile?.sector || 'N/A'
  const industry = data?.summary.assetProfile?.industry || 'N/A'
  const website = data?.summary.assetProfile?.website
  const employeeCount = toNumber(data?.summary.assetProfile?.fullTimeEmployees)
  const analystTarget = toNumber(data?.summary.financialData?.targetMeanPrice)
  const analystRecommendation = data?.summary.financialData?.recommendationKey
  const analystCoverage = toNumber(data?.summary.financialData?.numberOfAnalystOpinions)
  const fiftyTwoWeekLow = toNumber(data?.summary.summaryDetail?.fiftyTwoWeekLow ?? data?.chart.meta.fiftyTwoWeekLow)
  const fiftyTwoWeekHigh = toNumber(data?.summary.summaryDetail?.fiftyTwoWeekHigh ?? data?.chart.meta.fiftyTwoWeekHigh)
  const pricingDate = data?.summary.defaultKeyStatistics?.mostRecentQuarter || latestUpdate

  const history = useMemo<PriceHistoryPoint[]>(
    () =>
      (data?.chart.quotes ?? [])
        .map((point) => {
          const close = toNumber(point.close)

          return {
            date: point.date,
            label: formatDateLabel(point.date),
            close: close ?? Number.NaN,
            volume: toNumber(point.volume) ?? 0
          }
        })
        .filter((point) => Number.isFinite(point.close)),
    [data]
  )

  const chartData = useMemo(() => history.slice(-RECENT_PRICE_POINTS), [history])

  const financialMetrics = useMemo<FinancialMetric[]>(
    () => [
      {
        label: 'Total Revenue',
        value: formatNullableCompactCurrency(toNumber(data?.summary.financialData?.totalRevenue), financialCurrencyCode)
      },
      {
        label: 'EBITDA',
        value: formatNullableCompactCurrency(toNumber(data?.summary.financialData?.ebitda), financialCurrencyCode)
      },
      {
        label: 'Operating Cash Flow',
        value: formatNullableCompactCurrency(
          toNumber(data?.summary.financialData?.operatingCashflow),
          financialCurrencyCode
        )
      },
      {
        label: 'Free Cash Flow',
        value: formatNullableCompactCurrency(toNumber(data?.summary.financialData?.freeCashflow), financialCurrencyCode)
      },
      {
        label: 'Revenue Growth',
        value: formatNullableRatioPercent(toNumber(data?.summary.financialData?.revenueGrowth))
      },
      {
        label: 'Earnings Growth',
        value: formatNullableRatioPercent(toNumber(data?.summary.financialData?.earningsGrowth))
      }
    ],
    [data, financialCurrencyCode]
  )

  const recentEarnings = useMemo(
    () => [...(data?.summary.earnings?.financialsChart?.quarterly ?? [])].reverse().slice(0, 4),
    [data]
  )

  const stats = useMemo(
    () => [
      { label: 'Previous Close', value: formatNullableCurrency(previousClose, currencyCode) },
      { label: 'Change', value: formatNullableCurrency(priceChange, currencyCode) },
      { label: 'Market Cap', value: formatNullableCompactCurrency(marketCap, financialCurrencyCode) },
      { label: 'Enterprise Value', value: formatNullableCompactCurrency(enterpriseValue, financialCurrencyCode) },
      { label: 'Shares Out', value: formatNullableCompactCurrency(sharesOutstanding, financialCurrencyCode) },
      { label: 'Analyst Target', value: formatNullableCompactCurrency(analystTarget, financialCurrencyCode) },
      {
        label: '52W Range',
        value:
          fiftyTwoWeekLow !== null && fiftyTwoWeekHigh !== null
            ? `${formatCurrency(fiftyTwoWeekLow, currencyCode)} - ${formatCurrency(fiftyTwoWeekHigh, currencyCode)}`
            : 'N/A'
      },
      { label: 'Pricing Date', value: formatNullableDate(pricingDate) },
      { label: 'Analyst Coverage', value: formatNullableCompactNumber(analystCoverage) },
      { label: 'Employees', value: formatNullableCompactNumber(employeeCount) }
    ],
    [
      marketCap,
      enterpriseValue,
      sharesOutstanding,
      analystTarget,
      financialCurrencyCode,
      currencyCode,
      previousClose,
      priceChange,
      fiftyTwoWeekLow,
      fiftyTwoWeekHigh,
      pricingDate,
      analystCoverage,
      employeeCount
    ]
  )

  return (
    <div className='max-w-7xl space-y-6'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
        <div className='space-y-1'>
          <p className='font-display text-foreground/50 text-[8px] uppercase tracking-[0.24em]'>
            {formatRecommendation(analystRecommendation)}
          </p>
          <div className='flex flex-wrap items-end gap-3 font-display'>
            <h1 className='text-3xl font-semibold tracking-tight text-foreground'>{symbol}</h1>
            <h2 className='pb-1 text-base text-foreground/80'>{companyName}</h2>
          </div>
          <Eyebrow>
            {quoteType} on {exchangeName}
          </Eyebrow>
        </div>

        <div className='flex items-center gap-3'>
          <button
            type='button'
            onClick={() => startTransition(() => setRequestKey((value) => value + 1))}
            className='inline-flex h-9 items-center justify-center rounded-full border border-border/60 bg-background px-4 text-xs font-mono text-foreground transition-colors hover:bg-muted/40'>
            Refresh
          </button>
          <Link href='/' className='font-display text-foreground/70 text-sm transition-colors hover:text-foreground'>
            Back to overview
          </Link>
        </div>
      </div>

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

      {status === 'error' && (
        <div className='rounded-2xl border border-destructive/30 bg-destructive/5 p-5'>
          <p className='font-medium text-foreground'>Failed to load Yahoo Finance company data</p>
          <p className='mt-1 text-sm text-muted-foreground'>{error}</p>
        </div>
      )}

      {status === 'ready' && data && (
        <>
          <div className='grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.9fr)_22rem]'>
            <div className='rounded-lg bg-border/5 p-4 sm:p-5'>
              <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                <div className='space-y-1'>
                  <p className='font-display text-foreground/70 text-[8px] uppercase tracking-[0.24em]'>
                    Recent price history
                  </p>
                  <div className='flex items-end gap-2'>
                    <h2 className='font-display text-3xl font-semibold tracking-tight text-foreground'>
                      {formatNullableCurrency(latestPrice, currencyCode)}
                    </h2>
                    {trendPercent !== null && (
                      <span
                        className={`pb-1 text-sm font-display ${isPositive ? 'text-foreground' : 'text-slate-500'}`}>
                        {formatPercentValue(trendPercent)}
                      </span>
                    )}
                  </div>
                  <p className='text-sm text-muted-foreground'>{sourceName}</p>
                </div>

                <div className='text-left sm:text-right'>
                  <p className='text-foreground/70 text-[8px] uppercase tracking-[0.18em]'>Showing</p>
                  <p className='mt-2 text-sm text-foreground'>
                    {chartData.length} of {history.length.toLocaleString()} price points
                  </p>
                </div>
              </div>

              <div className='mt-4 h-80'>
                <EvilAreaChart
                  data={chartData}
                  chartConfig={getPriceChartConfig(`${symbol} close`, isPositive)}
                  xDataKey='label'
                  yDataKey='close'
                  className='h-full w-full min-h-0 font-display'
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

            <div className=''>
              <div className='grid grid-cols-2 gap-3'>
                {stats.map((stat, index) => (
                  <div key={index} className='rounded-lg font-display bg-border/8 p-3'>
                    <p className='text-foreground/60 text-[8px] uppercase tracking-[0.18em]'>{stat.label}</p>
                    <p className='mt-2 font-medium text-foreground text-base'>{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className='mt-4 rounded-xl bg-background/80 p-3'>
                <p className='text-[10px] font-display uppercase tracking-[0.18em] text-muted-foreground'>Business</p>
                <div className='mt-2 space-y-2 text-foreground text-sm'>
                  <div className='flex items-center space-x-4'>
                    <p>{sector}</p>
                    <p className='text-foreground/70'>{industry}</p>
                  </div>

                  {website && (
                    <a
                      href={website}
                      target='_blank'
                      rel='noreferrer'
                      className='font-display text-primary text-xs hover:text-foreground hover:underline underline-offset-2 decoration-dotted decoration-foreground/50 tracking-wider'>
                      {website}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className='rounded-xl mt-6 p-4 sm:p-5 space-y-6'>
            <div className='space-y-1'>
              <Eyebrow>Financial Snapshot</Eyebrow>
              <Title>The Fundamentals</Title>
              {/*<h2 className='font-display text-2xl font-semibold text-foreground tracking-normal'></h2>*/}
            </div>

            <div className='mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3'>
              {financialMetrics.map((item) => (
                <div key={item.label} className='rounded-xl bg-border/5 p-3'>
                  <Eyebrow>{item.label}</Eyebrow>
                  <p className='mt-2 font-display font-medium text-foreground text-base'>{item.value}</p>
                </div>
              ))}
            </div>

            <div className='pt-8 space-y-1'>
              <Eyebrow>Recent Earnings</Eyebrow>
              <Title>Quarterly Results</Title>
            </div>

            <div className='mt-4 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4'>
              {recentEarnings.length > 0 ? (
                recentEarnings.map((item) => (
                  <div key={`${item.fiscalQuarter || item.date}`} className='rounded-xl bg-background/80 p-3'>
                    <p className='text-lg font-mono uppercase tracking-[0.18em] text-foreground/60'>
                      {item.fiscalQuarter || item.date}
                    </p>
                    <div className='mt-2 space-y-1 font-display text-foreground/80 text-sm'>
                      <p className='w-32 flex items-center justify-between'>
                        <span>Revenue</span>
                        <span className='font-medium text-foreground'>
                          {formatNullableCompactCurrency(toNumber(item.revenue), financialCurrencyCode)}
                        </span>
                      </p>
                      <p className='w-32 flex items-center justify-between'>
                        <span>Earnings</span>
                        <span className='font-medium text-foreground'>
                          {formatNullableCompactCurrency(toNumber(item.earnings), financialCurrencyCode)}
                        </span>
                      </p>
                      <p className='w-32 flex items-center justify-between'>
                        <span>Margin</span>
                        <span className='font-medium text-foreground'>
                          {formatNullableRatioPercent(toNumber(item.profitMargin))}
                        </span>
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className='rounded-xl bg-background/80 p-3 text-sm text-muted-foreground'>
                  No recent Yahoo earnings rows were returned for this symbol.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/*
<div className='rounded-xl font-display bg-border/8 p-3'>
                  <p className='text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground'>Change</p>
                  <p className='mt-2 text-sm font-medium text-foreground'>
                    {formatNullableCurrency(priceChange, currencyCode)}
                  </p>
                </div>
                <div className='rounded-xl bg-background/80 p-3'>
                  <p className='text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground'>Market Cap</p>
                  <p className='mt-2 text-sm font-medium text-foreground'>
                    {formatNullableCompactCurrency(marketCap, currencyCode)}
                  </p>
                </div>
                <div className='rounded-xl bg-background/80 p-3'>
                  <p className='text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground'>TEV</p>
                  <p className='mt-2 text-sm font-medium text-foreground'>
                    {formatNullableCompactCurrency(enterpriseValue, currencyCode)}
                  </p>
                </div>
                <div className='rounded-xl bg-background/80 p-3'>
                  <p className='text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground'>Shares Out</p>
                  <p className='mt-2 text-sm font-medium text-foreground'>
                    {formatNullableCompactNumber(sharesOutstanding)}
                  </p>
                </div>
                <div className='rounded-xl bg-background/80 p-3'>
                  <p className='text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground'>
                    Pricing Date
                  </p>
                  <p className='mt-2 text-sm font-medium text-foreground'>{formatNullableDate(pricingDate)}</p>
                </div>
*/
