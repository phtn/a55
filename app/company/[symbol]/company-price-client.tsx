'use client'

import { EvilAreaChart } from '@/components/evilcharts/charts/area-chart'
import { usePageTitle } from '@/components/page-title-provider'
import { Eyebrow } from '@/components/ui/eyebrow'
import { Title } from '@/components/ui/title'
import {
  formatCurrency,
  formatDateLabel,
  formatNullableCompactCurrency,
  formatNullableCompactNumber,
  formatNullableCurrency,
  formatNullableDate,
  formatNullableRatioPercent,
  formatPercentValue,
  getCompanyNameFromData,
  getGrokQueryFromData,
  getHistoryStart,
  getPriceChartConfig,
  normalizeCompanySymbol,
  toNumber
} from '@/lib/helpers/formatters'
import { Icon } from '@/lib/icons'
import gsap from 'gsap'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Activity, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { StockHeader } from './stock-header'
import {
  AsyncStatus,
  CompanyChartApiData,
  CompanyPageData,
  CompanyPriceClientProps,
  CompanyQuoteApi,
  CompanyRecommendationsApi,
  CompanySummaryApi,
  FinancialMetric,
  GrokCacheEntry,
  GrokProfileApiResponse,
  OptionalAsyncStatus,
  PriceHistoryPoint,
  Yf2RequestBody,
  Yf2Response
} from './types'

const RECENT_PRICE_POINTS = 252

const EMPTY_HISTORY: PriceHistoryPoint[] = []
const COMPANY_QUOTE_FIELDS = [
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
] as const
const COMPANY_SUMMARY_MODULES = [
  'price',
  'summaryDetail',
  'defaultKeyStatistics',
  'financialData',
  'assetProfile',
  'earnings'
] as const

const companyDataCache = new Map<string, CompanyPageData>()
const companyDataPromiseCache = new Map<string, Promise<CompanyPageData>>()
const grokCache = new Map<string, GrokCacheEntry>()
const grokPromiseCache = new Map<string, Promise<GrokCacheEntry>>()

const readApiError = async (response: Response, fallbackMessage: string) => {
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    const payload = (await response.json()) as { error?: string }
    return payload.error || fallbackMessage
  }

  return (await response.text()) || fallbackMessage
}

const fetchYf2 = async <T,>(request: Yf2RequestBody, signal?: AbortSignal) => {
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

const fetchGrokProfile = async (query: string, signal?: AbortSignal) => {
  const response = await fetch(`/api/grok?query=${encodeURIComponent(query)}`, {
    signal
  })

  if (!response.ok) {
    throw new Error(await readApiError(response, 'Failed to load Grokipedia profile'))
  }

  return (await response.json()) as GrokProfileApiResponse
}

const fetchCompanyPageData = async (symbol: string, signal?: AbortSignal) => {
  const normalizedSymbol = normalizeCompanySymbol(symbol)

  const quotePromise = fetchYf2<CompanyQuoteApi>(
    {
      operation: 'quote',
      symbol: normalizedSymbol,
      options: {
        fields: COMPANY_QUOTE_FIELDS
      }
    },
    signal
  )
  const chartPromise = fetchYf2<CompanyChartApiData>(
    {
      operation: 'chart',
      symbol: normalizedSymbol,
      options: {
        period1: getHistoryStart(),
        interval: '1d'
      }
    },
    signal
  )
  const recommendationsPromise = fetchYf2<CompanyRecommendationsApi>(
    {
      operation: 'recommendationsBySymbol',
      symbol: normalizedSymbol
    },
    signal
  ).catch(() => null)
  const summaryPromise = fetchYf2<CompanySummaryApi>(
    {
      operation: 'quoteSummary',
      symbol: normalizedSymbol,
      options: {
        modules: COMPANY_SUMMARY_MODULES
      }
    },
    signal
  )

  const [quote, chart, recommendations, summary] = await Promise.all([
    quotePromise,
    chartPromise,
    recommendationsPromise,
    summaryPromise
  ])

  return {
    quote,
    chart,
    summary,
    recommendations
  } satisfies CompanyPageData
}

const getCachedCompanyData = (symbol: string) => companyDataCache.get(normalizeCompanySymbol(symbol))

const primeCompanyDataCache = (symbol: string, data: CompanyPageData) => {
  companyDataCache.set(normalizeCompanySymbol(symbol), data)
}

const loadCompanyPageData = (symbol: string) => {
  const normalizedSymbol = normalizeCompanySymbol(symbol)
  const cachedData = companyDataCache.get(normalizedSymbol)

  if (cachedData) {
    return Promise.resolve(cachedData)
  }

  const existingPromise = companyDataPromiseCache.get(normalizedSymbol)

  if (existingPromise) {
    return existingPromise
  }

  const promise = fetchCompanyPageData(normalizedSymbol)
    .then((data) => {
      companyDataCache.set(normalizedSymbol, data)
      return data
    })
    .finally(() => {
      companyDataPromiseCache.delete(normalizedSymbol)
    })

  companyDataPromiseCache.set(normalizedSymbol, promise)

  return promise
}

const getCachedGrokEntry = (symbol: string) => grokCache.get(normalizeCompanySymbol(symbol))

const loadGrokCacheEntry = (symbol: string, query: string | null) => {
  const normalizedSymbol = normalizeCompanySymbol(symbol)
  const cachedEntry = grokCache.get(normalizedSymbol)

  if (cachedEntry) {
    return Promise.resolve(cachedEntry)
  }

  const existingPromise = grokPromiseCache.get(normalizedSymbol)

  if (existingPromise) {
    return existingPromise
  }

  if (!query) {
    const idleEntry: GrokCacheEntry = {
      error: null,
      profile: null,
      status: 'idle'
    }

    grokCache.set(normalizedSymbol, idleEntry)
    return Promise.resolve(idleEntry)
  }

  const promise = fetchGrokProfile(query)
    .then(
      (profile) =>
        ({
          error: null,
          profile,
          status: 'ready'
        }) satisfies GrokCacheEntry
    )
    .catch(
      (error) =>
        ({
          error: error instanceof Error ? error.message : 'Unknown error',
          profile: null,
          status: 'error'
        }) satisfies GrokCacheEntry
    )
    .then((entry) => {
      grokCache.set(normalizedSymbol, entry)
      return entry
    })
    .finally(() => {
      grokPromiseCache.delete(normalizedSymbol)
    })

  grokPromiseCache.set(normalizedSymbol, promise)

  return promise
}

const preloadCompanyRoute = (symbol: string) => {
  const normalizedSymbol = normalizeCompanySymbol(symbol)
  const cachedData = companyDataCache.get(normalizedSymbol)

  if (cachedData) {
    void loadGrokCacheEntry(normalizedSymbol, getGrokQueryFromData(cachedData))
    return
  }

  const existingPromise = companyDataPromiseCache.get(normalizedSymbol)

  if (existingPromise) {
    void existingPromise.then((data) => loadGrokCacheEntry(normalizedSymbol, getGrokQueryFromData(data)))
    return
  }

  void loadCompanyPageData(normalizedSymbol).then((data) =>
    loadGrokCacheEntry(normalizedSymbol, getGrokQueryFromData(data))
  )
}

export const CompanyPriceClient = ({ symbol }: CompanyPriceClientProps) => {
  const normalizedSymbol = normalizeCompanySymbol(symbol)
  const cachedInitialData = getCachedCompanyData(normalizedSymbol) ?? null
  const cachedInitialGrokEntry = getCachedGrokEntry(normalizedSymbol)
  const rootRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const [data, setData] = useState<CompanyPageData | null>(cachedInitialData)
  const [status, setStatus] = useState<AsyncStatus>(cachedInitialData ? 'ready' : 'loading')
  const [error, setError] = useState<string | null>(null)
  const [grokProfile, setGrokProfile] = useState<GrokProfileApiResponse | null>(cachedInitialGrokEntry?.profile ?? null)
  const [grokStatus, setGrokStatus] = useState<OptionalAsyncStatus>(cachedInitialGrokEntry?.status ?? 'idle')
  const [grokError, setGrokError] = useState<string | null>(cachedInitialGrokEntry?.error ?? null)
  const [requestKey] = useState(0)
  const { setTitle, setWebsite } = usePageTitle()

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const cachedData = getCachedCompanyData(normalizedSymbol) ?? null
      const cachedGrokEntry = getCachedGrokEntry(normalizedSymbol)

      setData(cachedData)
      setStatus(cachedData && requestKey === 0 ? 'ready' : 'loading')
      setError(null)
      setGrokProfile(cachedGrokEntry?.profile ?? null)
      setGrokStatus(cachedGrokEntry?.status ?? 'idle')
      setGrokError(cachedGrokEntry?.error ?? null)

      try {
        const nextData =
          requestKey === 0 ? await loadCompanyPageData(normalizedSymbol) : await fetchCompanyPageData(normalizedSymbol)

        if (requestKey > 0) {
          primeCompanyDataCache(normalizedSymbol, nextData)
        }

        if (cancelled) {
          return
        }

        setData(nextData)
        setStatus('ready')
        const nextGrokEntry = await loadGrokCacheEntry(normalizedSymbol, getGrokQueryFromData(nextData))

        if (cancelled) {
          return
        }

        setGrokProfile(nextGrokEntry.profile)
        setGrokStatus(nextGrokEntry.status)
        setGrokError(nextGrokEntry.error)
      } catch (nextError) {
        if (cancelled) {
          return
        }

        setData(null)
        setStatus('error')
        setError(nextError instanceof Error ? nextError.message : 'Unknown error')
        setGrokProfile(null)
        setGrokStatus('idle')
        setGrokError(null)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [normalizedSymbol, requestKey])

  const currencyCode =
    data?.quote.currency ||
    data?.summary.price?.currency ||
    data?.chart.meta.currency ||
    data?.summary.financialData?.financialCurrency ||
    'USD'
  const financialCurrencyCode = data?.summary.financialData?.financialCurrency || currencyCode
  const companyName = data ? getCompanyNameFromData(data, normalizedSymbol) : normalizedSymbol
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
      const headerValues = rootRef.current?.querySelectorAll('[data-animate="header-value"]')
      const heroShells = rootRef.current?.querySelectorAll('[data-animate="hero-shell"]')
      const heroValues = rootRef.current?.querySelectorAll('[data-animate="hero-value"]')
      const heroChart = rootRef.current?.querySelectorAll('[data-animate="hero-chart"]')
      const statsCards = rootRef.current?.querySelectorAll('[data-animate="stats-card"]')
      const businessLinks = rootRef.current?.querySelectorAll('[data-animate="business-link"]')
      const sectionHeadings = rootRef.current?.querySelectorAll('[data-animate="section-heading"]')
      const metricCards = rootRef.current?.querySelectorAll('[data-animate="metric-card"]')
      const earningsCards = rootRef.current?.querySelectorAll('[data-animate="earnings-card"]')
      const profileBlocks = rootRef.current?.querySelectorAll('[data-animate="profile-block"]')

      const timeline = gsap.timeline({
        defaults: {
          ease: 'power3.out'
        }
      })

      if (headerValues?.length) {
        timeline.from(headerValues, {
          x: -18,
          opacity: 0,
          duration: 0.44,
          stagger: 0.08
        })
      }

      if (heroShells?.length) {
        timeline.from(
          heroShells,
          {
            x: -24,
            opacity: 0,
            duration: 0.52,
            stagger: 0.12
          },
          '-=0.16'
        )
      }

      if (heroValues?.length) {
        timeline.from(
          heroValues,
          {
            y: 18,
            opacity: 0,
            duration: 0.34,
            stagger: 0.06
          },
          '-=0.34'
        )
      }

      if (heroChart?.length) {
        timeline.from(
          heroChart,
          {
            y: 24,
            opacity: 0,
            duration: 0.48
          },
          '-=0.2'
        )
      }

      if (statsCards?.length) {
        timeline.from(
          statsCards,
          {
            y: 16,
            opacity: 0,
            duration: 0.32,
            stagger: 0.04
          },
          '-=0.28'
        )
      }

      if (businessLinks?.length) {
        timeline.from(
          businessLinks,
          {
            y: 10,
            opacity: 0,
            duration: 0.22,
            stagger: 0.03
          },
          '-=0.16'
        )
      }

      if (sectionHeadings?.length) {
        timeline.from(
          sectionHeadings,
          {
            y: 16,
            opacity: 0,
            duration: 0.34,
            stagger: 0.12
          },
          '-=0.12'
        )
      }

      if (metricCards?.length) {
        timeline.from(
          metricCards,
          {
            y: 18,
            opacity: 0,
            duration: 0.34,
            stagger: 0.04
          },
          '-=0.18'
        )
      }

      if (earningsCards?.length) {
        timeline.from(
          earningsCards,
          {
            y: 16,
            opacity: 0,
            duration: 0.3,
            stagger: 0.04
          },
          '-=0.14'
        )
      }

      if (profileBlocks?.length) {
        timeline.from(
          profileBlocks,
          {
            y: 18,
            opacity: 0,
            duration: 0.42,
            stagger: 0.08
          },
          '-=0.12'
        )
      }
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
          if (!recommendation.symbol || recommendation.symbol === normalizedSymbol) {
            return false
          }

          return values.findIndex((value) => value.symbol === recommendation.symbol) === index
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 6),
    [data, normalizedSymbol]
  )

  useEffect(() => {
    if (relatedTickers.length === 0) {
      return
    }

    relatedTickers.forEach((ticker) => {
      router.prefetch(`/company/${ticker.symbol}`)
      preloadCompanyRoute(ticker.symbol)
    })
  }, [relatedTickers, router])

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
    <div ref={rootRef} className='space-y-24'>
      <div className='flex justify-between h-[50lvh] gap-16'>
        <div data-animate='page-header' className='flex flex-col sm:flex-row sm:justify-between'>
          <div className='md:w-2xl 2xl:w-3xl'>
            <StockHeader
              analystRecommendation={analystRecommendation}
              quoteType={quoteType}
              exchangeName={exchangeName}
              symbol={symbol}
              trendPercent={trendPercent}
              latestPrice={latestPrice}
              isPositive={isPositive}
              currencyCode={currencyCode}
            />
            <Activity mode={status === 'loading' ? 'visible' : 'hidden'}>
              <div className='rounded-2xl border border-border/50 bg-background/70 p-0 md:p-5'>
                <div className='space-y-2'>
                  <div className='h-3 w-28 rounded-full bg-muted/60' />
                  <div className='h-8 w-40 rounded-full bg-muted/60' />
                </div>
                <div className='mt-4 md:h-60 h-64 md:w-2xl 2xl:w-3xl'>
                  <EvilAreaChart
                    data={EMPTY_HISTORY}
                    chartConfig={getPriceChartConfig(`${symbol} close`, true)}
                    xDataKey='label'
                    yDataKey='close'
                    className='h-full w-full min-h-0'
                    isLoading
                    loadingPoints={5}
                    hideLegend
                    hideCartesianGrid
                  />
                </div>
              </div>
            </Activity>
            <Activity mode={status === 'error' ? 'visible' : 'hidden'}>
              <div className='rounded-md border border-foreground bg-foreground/2 p-2 md:p-5'>
                <p className='font-medium text-foreground'>Failed to load Yahoo Finance company data</p>
                <p className='mt-1 text-sm text-muted-foreground'>{error}</p>
              </div>
            </Activity>

            <div data-animate='hero-card' className='md:flex'>
              <div
                data-animate='hero-shell'
                className='rounded-xl bg-linear-to-b from-border/5 to-transparent p-0 md:px-4'>
                <div className='hidden _flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                  <div data-animate='hero-value' className='space-y-1'>
                    <div className='hidden md:flex items-end gap-4'>
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
                    <p className='hidden md:flex text-sm text-muted-foreground'>{sourceName}</p>
                  </div>

                  <div data-animate='hero-value' className='hidden md:flex text-left sm:text-right'>
                    <p className='mt-2 text-sm text-foreground/60'>
                      {chartData.length} of {history.length.toLocaleString()} price points
                    </p>
                  </div>
                </div>

                <div data-animate='hero-chart' className='mt-4 h-64 md:h-100 md:w-2xl 2xl:w-3xl'>
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
            </div>
          </div>
        </div>

        <div className='-mt-2'>
          <div data-animate='hero-shell' className='space-y-8'>
            <div className='grid grid-cols-2 gap-2.5'>
              {stats.map((stat, index) => (
                <div
                  key={index}
                  data-animate='stats-card'
                  className='rounded-xl font-display bg-border/6 ps-2 pe-6 py-2'>
                  <Eyebrow>{stat.label}</Eyebrow>
                  <p className='mt-2 font-medium text-foreground text-base'>{stat.value}</p>
                </div>
              ))}
            </div>

            <div data-animate='hero-value' className='rounded-xl bg-background/80 px-2'>
              <Eyebrow>Business</Eyebrow>
              <div className='mt-2 space-y-2 text-foreground text-sm'>
                <div className='font-display flex items-center space-x-4'>
                  <p className='font-medium'>{sector}</p>
                  <p className='text-foreground/70'>{industry}</p>
                </div>

                {relatedTickers.length > 0 && (
                  <div className=''>
                    <div className='mt-3 grid grid-cols-4 gap-1.5'>
                      {relatedTickers.slice(0, 4).map((ticker) => (
                        <Link
                          key={ticker.symbol}
                          href={`/company/${ticker.symbol}`}
                          data-animate='business-link'
                          className='inline-flex items-center justify-between rounded-sm border border-border bg-border/20 hover:border-foreground/25 px-2 py-1.25 font-display text-xs uppercase text-foreground/78 transition-colors hover:bg-foreground/4 hover:text-foreground'>
                          <span className='tracking-wider font-medium'>{ticker.symbol}</span>
                          <span className='text-foreground/70 text-[8px] tracking-tighter'>
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
        <div className='bg-linear-to-b from-border/20 h-full hidden 2xl:flex 2xl:w-3xs'></div>
      </div>

      {status === 'ready' && data && (
        <>
          <div className='rounded-xl mt-10 space-y-10 w-6xl'>
            <div data-animate='section-heading' className='space-y-1'>
              <Title>Fundamentals</Title>
            </div>

            <div className='mt-6 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3'>
              {financialMetrics.map((item) => (
                <div key={item.label} data-animate='metric-card' className='rounded-xl bg-border/5 p-3'>
                  <Eyebrow>{item.label}</Eyebrow>
                  <p className='mt-2 font-display font-medium text-foreground text-base'>{item.value}</p>
                </div>
              ))}
            </div>

            <div data-animate='section-heading' className='pt-16 space-y-1'>
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
                      <p className='w-40 flex items-center justify-between'>
                        <span>Revenue</span>
                        <span className='font-medium text-foreground'>
                          {formatNullableCompactCurrency(toNumber(item.revenue), financialCurrencyCode)}
                        </span>
                      </p>
                      <p className='w-40 flex items-center justify-between'>
                        <span>Earnings</span>
                        <span className='font-medium text-foreground'>
                          {formatNullableCompactCurrency(toNumber(item.earnings), financialCurrencyCode)}
                        </span>
                      </p>
                      <p className='w-40 flex items-center justify-between'>
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
                    {grokProfile?.data.factChecked && <Icon name='grok' className='size-3.5' />}
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
                <div className='space-y-4 text-base leading-7 text-foreground/70 font-display'>
                  <p className='text-justify'>{profileParagraphs.slice().join(' ')}</p>
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
