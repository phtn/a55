'use client'

import { EvilAreaChart } from '@/components/evilcharts/charts/area-chart'
import type { ChartConfig } from '@/components/evilcharts/ui/chart'
import { usePageTitle } from '@/components/page-title-provider'
import { Eyebrow } from '@/components/ui/eyebrow'
import { Title } from '@/components/ui/title'
import { Icon } from '@/lib/icons'
import gsap from 'gsap'
import Link from 'next/link'
import { startTransition, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

const POSITIVE_CHART_COLOR = 'var(--foreground)'
const NEGATIVE_CHART_COLOR = 'var(--muted-foreground)'
const DEFAULT_CURRENCY_CODE = 'USD'
const HISTORY_LOOKBACK_DAYS = 400
const RECENT_PRICE_POINTS = 252

type AsyncStatus = 'loading' | 'ready' | 'error'

type OptionalAsyncStatus = AsyncStatus | 'idle'

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

interface CompanyRecommendationsApi {
  symbol: string
  recommendedSymbols: {
    symbol: string
    score: number
  }[]
}

interface CompanyPageData {
  quote: CompanyQuoteApi
  chart: CompanyChartApiData
  summary: CompanySummaryApi
  recommendations: CompanyRecommendationsApi | null
}

interface GrokProfileApiData {
  title: string | null
  factChecked: string | null
  leadHtml: string
  leadText: string
}

interface GrokProfileApiResponse {
  page: string
  url: string
  data: GrokProfileApiData
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

const getGrokipediaHref = (query: string) =>
  `https://grokipedia.com/page/${encodeURIComponent(query.trim().replace(/\s+/g, '_'))}`

const fetchGrokProfile = async (query: string, signal: AbortSignal) => {
  const response = await fetch(`/api/grok?query=${encodeURIComponent(query)}`, {
    signal
  })

  if (!response.ok) {
    throw new Error(await readApiError(response, 'Failed to load Grokipedia profile'))
  }

  return (await response.json()) as GrokProfileApiResponse
}

export const CompanyPriceClient = ({ symbol }: CompanyPriceClientProps) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<CompanyPageData | null>(null)
  const [status, setStatus] = useState<AsyncStatus>('loading')
  const [error, setError] = useState<string | null>(null)
  const [grokProfile, setGrokProfile] = useState<GrokProfileApiResponse | null>(null)
  const [grokStatus, setGrokStatus] = useState<OptionalAsyncStatus>('idle')
  const [grokError, setGrokError] = useState<string | null>(null)
  const [requestKey, setRequestKey] = useState(0)
  const { setTitle, setWebsite } = usePageTitle()

  useEffect(() => {
    const controller = new AbortController()

    const load = async () => {
      setStatus('loading')
      setError(null)
      setGrokProfile(null)
      setGrokStatus('idle')
      setGrokError(null)

      const loadGrok = (query: string) => {
        setGrokStatus('loading')

        void fetchGrokProfile(query, controller.signal)
          .then((nextProfile) => {
            if (controller.signal.aborted) {
              return
            }

            setGrokProfile(nextProfile)
            setGrokStatus('ready')
          })
          .catch((nextError) => {
            if (controller.signal.aborted) {
              return
            }

            setGrokProfile(null)
            setGrokStatus('error')
            setGrokError(nextError instanceof Error ? nextError.message : 'Unknown error')
          })
      }

      try {
        const quotePromise = fetchYf2<CompanyQuoteApi>(
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
        )
        const chartPromise = fetchYf2<CompanyChartApiData>(
          {
            operation: 'chart',
            symbol,
            options: {
              period1: getHistoryStart(),
              interval: '1d'
            }
          },
          controller.signal
        )
        const recommendationsPromise = fetchYf2<CompanyRecommendationsApi>(
          {
            operation: 'recommendationsBySymbol',
            symbol
          },
          controller.signal
        ).catch(() => null)
        const summaryPromise = fetchYf2<CompanySummaryApi>(
          {
            operation: 'quoteSummary',
            symbol,
            options: {
              modules: ['price', 'summaryDetail', 'defaultKeyStatistics', 'financialData', 'assetProfile', 'earnings']
            }
          },
          controller.signal
        )

        const quote = await quotePromise
        const quoteCompanyName = quote.longName || quote.shortName

        if (quoteCompanyName) {
          loadGrok(quoteCompanyName)
        }

        const [chart, recommendations, summary] = await Promise.all([
          chartPromise,
          recommendationsPromise,
          summaryPromise
        ])
        const fallbackCompanyName = chart.meta.longName || chart.meta.shortName

        if (!quoteCompanyName && fallbackCompanyName) {
          loadGrok(fallbackCompanyName)
        }

        if (controller.signal.aborted) {
          return
        }

        setData({ quote, chart, summary, recommendations })
        setStatus('ready')
      } catch (nextError) {
        if (controller.signal.aborted) {
          return
        }

        controller.abort()
        setData(null)
        setStatus('error')
        setError(nextError instanceof Error ? nextError.message : 'Unknown error')
        setGrokProfile(null)
        setGrokStatus('idle')
        setGrokError(null)
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
  const companyWebsite = data?.summary.assetProfile?.website || null

  useEffect(() => {
    setTitle(companyName)
    setWebsite(companyWebsite)

    return () => {
      setTitle(null)
      setWebsite(null)
    }
  }, [companyName, companyWebsite, setTitle, setWebsite])

  useLayoutEffect(() => {
    if (status !== 'ready' || !data || !rootRef.current) {
      return
    }

    if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({
        defaults: {
          ease: 'power3.out'
        }
      })

      timeline
        .from('[data-animate="page-header"]', {
          x: -24,
          opacity: 0,
          duration: 0.8
        })
        .from(
          '[data-animate="hero-card"]',
          {
            x: -28,
            opacity: 0,
            duration: 0.65
          },
          '-=0.2'
        )
        .from(
          '[data-animate="stats-card"]',
          {
            x: -18,
            opacity: 0,
            duration: 0.4,
            stagger: 0.05
          },
          '-=0.35'
        )
        .from(
          '[data-animate="section-heading"]',
          {
            x: -18,
            opacity: 0,
            duration: 0.4,
            stagger: 0.12
          },
          '-=0.2'
        )
        .from(
          '[data-animate="metric-card"]',
          {
            x: -18,
            opacity: 0,
            duration: 0.4,
            stagger: 0.04
          },
          '-=0.25'
        )
        .from(
          '[data-animate="earnings-card"]',
          {
            x: -18,
            opacity: 0,
            duration: 0.38,
            stagger: 0.04
          },
          '-=0.2'
        )
        .from(
          '[data-animate="profile-block"]',
          {
            x: -22,
            opacity: 0,
            duration: 0.5,
            stagger: 0.08
          },
          '-=0.15'
        )
    }, rootRef)

    return () => ctx.revert()
  }, [data, status, symbol])

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
  const grokQuery =
    data?.quote.longName || data?.quote.shortName || data?.chart.meta.longName || data?.chart.meta.shortName || null
  const yahooProfile = data?.summary.assetProfile?.longBusinessSummary?.trim() || null
  const usingGrokProfile = grokStatus === 'ready' && Boolean(grokProfile?.data.leadText)
  const profileText =
    (usingGrokProfile ? grokProfile?.data.leadText : null) ||
    (grokStatus === 'error' || grokStatus === 'idle' ? yahooProfile : null) ||
    null
  const profileParagraphs = profileText
    ? profileText
        .split('\n\n')
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
    : []
  const grokipediaHref = grokProfile?.url || (grokQuery ? getGrokipediaHref(grokQuery) : null)
  const sector = data?.summary.assetProfile?.sector || 'N/A'
  const industry = data?.summary.assetProfile?.industry || 'N/A'
  const employeeCount = toNumber(data?.summary.assetProfile?.fullTimeEmployees)
  const analystTarget = toNumber(data?.summary.financialData?.targetMeanPrice)
  const analystRecommendation = data?.summary.financialData?.recommendationKey
  const analystCoverage = toNumber(data?.summary.financialData?.numberOfAnalystOpinions)
  const fiftyTwoWeekLow = toNumber(data?.summary.summaryDetail?.fiftyTwoWeekLow ?? data?.chart.meta.fiftyTwoWeekLow)
  const fiftyTwoWeekHigh = toNumber(data?.summary.summaryDetail?.fiftyTwoWeekHigh ?? data?.chart.meta.fiftyTwoWeekHigh)
  const pricingDate = data?.summary.defaultKeyStatistics?.mostRecentQuarter || latestUpdate
  const relatedTickers = useMemo(
    () =>
      (data?.recommendations?.recommendedSymbols ?? [])
        .map((recommendation) => ({
          symbol: recommendation.symbol.trim().toUpperCase(),
          score: recommendation.score
        }))
        .filter((recommendation, index, values) => {
          if (!recommendation.symbol || recommendation.symbol === symbol.toUpperCase()) {
            return false
          }

          return values.findIndex((value) => value.symbol === recommendation.symbol) === index
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 6),
    [data, symbol]
  )

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
    <div ref={rootRef} className='max-w-7xl space-y-6'>
      <div data-animate='page-header' className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
        <div className='space-y-1'>
          <div className='flex flex-wrap items-end gap-3 font-display'>
            <div>
              <p className='flex items-center space-x-px font-display text-foreground text-[8px] italic uppercase tracking-widest'>
                <Icon name='arrow-right' className='size-3' />
                <span>{formatRecommendation(analystRecommendation)}</span>
              </p>
              <h1 className='text-3xl font-semibold tracking-tight text-foreground'>{symbol}</h1>
            </div>
            <h2 className='pb-1 text-base text-foreground/80'>{companyName}</h2>
          </div>
          <Eyebrow>
            {quoteType} on {exchangeName}
          </Eyebrow>
        </div>

        <div className='flex items-center w-1/3 gap-3'>
          <button
            type='button'
            onClick={() => startTransition(() => setRequestKey((value) => value + 1))}
            className='inline-flex size-10 aspect-square items-center justify-center rounded-full border border-transparent hover:border-border hover:bg-border/50 hover:text-foreground text-foreground/40 text-xs font-mono transition-colors _hover:bg-muted/40'>
            <Icon name={data ? 'refresh' : 'spinner-ring'} className='size-5 rotate-120' />
          </button>
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
          <div data-animate='hero-card' className='grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.9fr)_22rem]'>
            <div className='rounded-xl bg-linear-to-b from-border/5 to-transparent p-4 sm:p-5'>
              <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                <div className='space-y-1'>
                  {/*<p className='font-display text-foreground text-[8px] uppercase tracking-[0.24em]'>
                    {formatRecommendation(analystRecommendation)}
                  </p>*/}
                  <div className='flex items-end gap-4'>
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
                  <p className='mt-2 text-sm text-foreground/60'>
                    {chartData.length} of {history.length.toLocaleString()} price points
                  </p>
                </div>
              </div>

              <div className='mt-4 h-100'>
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
                  <div key={index} data-animate='stats-card' className='rounded-xl font-display bg-border/6 p-3'>
                    <p className='text-foreground/60 text-[8px] uppercase tracking-[0.18em]'>{stat.label}</p>
                    <p className='mt-2 font-medium text-foreground text-base'>{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className='mt-2 rounded-xl bg-background/80 p-3'>
                <Eyebrow>Business</Eyebrow>
                <div className='mt-2 space-y-2 text-foreground text-sm'>
                  <div className='font-display flex items-center space-x-4'>
                    <p className='font-medium'>{sector}</p>
                    <p className='text-foreground/70'>{industry}</p>
                  </div>

                  {relatedTickers.length > 0 && (
                    <div className=''>
                      <div className='mt-0 flex flex-wrap gap-2'>
                        {relatedTickers.map((ticker) => (
                          <Link
                            key={ticker.symbol}
                            href={`/company/${ticker.symbol}`}
                            className='inline-flex items-center gap-1 rounded-sm border border-border bg-border/20 hover:border-foreground/25 px-2.5 py-1 font-display text-[8px] uppercase text-foreground/78 transition-colors hover:bg-foreground/4 hover:text-foreground'>
                            <span className='tracking-wider'>{ticker.symbol}</span>
                            <span className='text-foreground/60'>
                              {Math.round(ticker.score * 100)}
                              <span className='text-[7px]'>%</span>
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className='rounded-xl mt-10 space-y-6'>
            <div data-animate='section-heading' className='space-y-1'>
              <Title>Fundamentals</Title>
            </div>

            <div className='mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3'>
              {financialMetrics.map((item) => (
                <div key={item.label} data-animate='metric-card' className='rounded-xl bg-border/5 p-3'>
                  <Eyebrow>{item.label}</Eyebrow>
                  <p className='mt-2 font-display font-medium text-foreground text-base'>{item.value}</p>
                </div>
              ))}
            </div>

            <div data-animate='section-heading' className='pt-8 space-y-1'>
              {/*<Eyebrow>Recent Earnings</Eyebrow>*/}
              <Title>Quarterly Results</Title>
            </div>

            <div className='mt-4 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4'>
              {recentEarnings.length > 0 ? (
                recentEarnings.map((item) => (
                  <div
                    key={`${item.fiscalQuarter || item.date}`}
                    data-animate='earnings-card'
                    className='rounded-xl bg-background/80 p-3'>
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
                <div
                  data-animate='earnings-card'
                  className='rounded-xl bg-background/80 p-3 text-sm text-muted-foreground'>
                  No recent Yahoo earnings rows were returned for this symbol.
                </div>
              )}
            </div>

            <div id='profile-info' className='rounded-xl my-20 space-y-6'>
              <div data-animate='section-heading' className='flex items-start justify-between gap-4'>
                <div className='space-y-0'>
                  {usingGrokProfile ? (
                    <Eyebrow>{'Grokipedia'}</Eyebrow>
                  ) : yahooProfile ? (
                    <Eyebrow>Yahoo Finance</Eyebrow>
                  ) : null}
                  <Title>Info</Title>
                </div>

                {grokipediaHref && (
                  <a
                    href={grokipediaHref}
                    target='_blank'
                    rel='noreferrer'
                    className='flex items-center space-x-2 pt-1 font-display text-foreground/70 text-xs hover:text-foreground hover:underline underline-offset-2 decoration-dotted decoration-foreground/50 tracking-wider'>
                    <Icon name='grok' className='size-3.5' />
                    <span>{grokProfile?.data.factChecked ?? 'Read in Grokipedia'}</span>
                  </a>
                )}
              </div>

              {grokStatus === 'loading' && (
                <div data-animate='profile-block' className='rounded-xl bg-border/5 p-4'>
                  <div className='space-y-2'>
                    <div className='h-3 w-40 rounded-full bg-muted/60' />
                    <div className='h-3 w-full rounded-full bg-muted/50' />
                    <div className='h-3 w-[92%] rounded-full bg-muted/50' />
                    <div className='h-3 w-[78%] rounded-full bg-muted/50' />
                  </div>
                </div>
              )}

              {profileParagraphs.length > 0 && (
                <div className='space-y-4 text-base leading-7 text-foreground/85'>
                  {profileParagraphs.map((paragraph, index) => (
                    <p
                      key={`${index}-${paragraph.slice(0, 24)}`}
                      data-animate='profile-block'
                      className=' text-balance'>
                      {paragraph}
                    </p>
                  ))}
                </div>
              )}

              {grokStatus === 'error' && !yahooProfile && (
                <div
                  data-animate='profile-block'
                  className='rounded-xl bg-background/80 p-3 text-sm text-muted-foreground'>
                  {grokError || 'No Grokipedia profile was returned for this company.'}
                </div>
              )}

              {grokStatus === 'idle' && !yahooProfile && (
                <div
                  data-animate='profile-block'
                  className='rounded-xl bg-background/80 p-3 text-sm text-muted-foreground'>
                  No company profile is available yet.
                </div>
              )}

              {grokStatus === 'error' && yahooProfile && (
                <p data-animate='profile-block' className='text-xs text-muted-foreground'>
                  Showing the Yahoo Finance summary because Grokipedia was unavailable.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
