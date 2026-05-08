'use client'

import { Stock, type StockCardData } from '@/components/cards/stock'
import { EvilAreaChart } from '@/components/evilcharts/charts/area-chart'
import type { ChartConfig } from '@/components/evilcharts/ui/chart'
import { useOverviewPrefetch } from '@/components/overview-prefetch-provider'
import { Icon } from '@/lib/icons'
import gsap from 'gsap'
import { startTransition, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { PixelGrid } from 'three-px-react'

const POSITIVE_CHART_COLOR = 'var(--foreground)'
const NEGATIVE_CHART_COLOR = 'var(--muted-foreground)'
const OVERVIEW_SYMBOLS = ['SPY', 'QQQ', 'DIA', 'IWM', 'VTI', 'GLD', 'TLT', 'XLE'] as const
const OVERVIEW_HISTORY_DAYS = 180
const MOVER_COUNT = 6
const MOVER_SECTION_CONFIG = [
  {
    key: 'active',
    title: 'Most Active',
    description: 'Highest-volume names in the session',
    screenerId: 'most_actives'
  },
  {
    key: 'gainers',
    title: 'Top Gainers',
    description: 'Leaders by percentage move',
    screenerId: 'day_gainers'
  },
  {
    key: 'losers',
    title: 'Top Losers',
    description: 'Biggest laggards by percentage move',
    screenerId: 'day_losers'
  }
] as const

interface ContentProps {
  page?: string
}

type AsyncStatus = 'loading' | 'ready' | 'error'
type MoverSectionKey = (typeof MOVER_SECTION_CONFIG)[number]['key']

type HistoryPoint = Record<string, string | number> & {
  label: string
  price: number
}

interface Yf2Response<T> {
  operation: string
  data: T
}

interface Yf2RequestBody {
  operation: string
  symbol?: string
  symbols?: string[]
  query?: string
  options?: Record<string, unknown>
}

interface QuoteApiItem {
  symbol: string
  currency?: string
  shortName?: string
  longName?: string
  displayName?: string
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

interface ChartApiQuote {
  date: string
  close: number | null
}

interface ChartApiData {
  meta: {
    symbol: string
    currency?: string
    shortName?: string
    longName?: string
  }
  quotes: ChartApiQuote[]
}

interface ScreenerApiQuote {
  symbol: string
  currency?: string
  shortName?: string
  longName?: string
  quoteType?: string
  fullExchangeName?: string
  regularMarketPrice?: number
  regularMarketPreviousClose?: number
  regularMarketChange?: number
  regularMarketChangePercent?: number
  regularMarketTime?: number
  regularMarketVolume?: number
  marketCap?: number
}

interface ScreenerApiData {
  quotes: ScreenerApiQuote[]
}

interface OverviewQuote {
  symbol: string
  name: string
  currency: string
  quoteType: string
  exchange: string
  latestPrice: number | null
  previousClose: number | null
  change: number | null
  changePercent: number | null
  latestUpdate: string | null
  latestSource: string
  marketCap: number | null
  volume: number | null
  history: HistoryPoint[]
}

interface MoverQuote {
  symbol: string
  name: string
  currency: string
  latestPrice: number | null
  changePercent: number | null
  volume: number | null
  marketCap: number | null
}

interface MoverSection {
  key: MoverSectionKey
  title: string
  description: string
  items: MoverQuote[]
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

const getOverviewHistoryStart = () => {
  const start = new Date()
  start.setDate(start.getDate() - OVERVIEW_HISTORY_DAYS)
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

const formatPrice = (value: number, currencyCode = 'USD') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode || 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)

const formatPriceValue = (value: number | null, currencyCode = 'USD') =>
  value === null ? 'N/A' : formatPrice(value, currencyCode)

const formatCompactNumber = (value: number) =>
  new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: value >= 1_000_000_000 ? 2 : 1
  }).format(value)

const formatPercent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`

const formatPercentValue = (value: number | null) => (value === null ? 'N/A' : formatPercent(value))

const formatUpdateTime = (value: number | string | null | undefined) => {
  if (value === undefined || value === null) {
    return 'Unknown'
  }

  const date = typeof value === 'number' ? new Date(value > 1_000_000_000_000 ? value : value * 1000) : new Date(value)

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

const formatHistoryLabel = (value: string, index: number) => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return `Point ${index + 1}`
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

const getQuoteName = (quote: QuoteApiItem) => quote.displayName || quote.shortName || quote.longName || quote.symbol

const getScreenerQuoteName = (quote: ScreenerApiQuote) => quote.shortName || quote.longName || quote.symbol

const getExternalQuoteHref = (symbol: string) => `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}`

const formatMarketCapLabel = (value: number | null) => (value === null ? undefined : formatCompactNumber(value))

const buildHistory = (quotes: ChartApiQuote[]) =>
  quotes.reduce<HistoryPoint[]>((history, point, index) => {
    const price = toNumber(point.close)

    if (price === null) {
      return history
    }

    history.push({
      label: formatHistoryLabel(point.date, index),
      price
    })

    return history
  }, [])

const getChangeValue = (
  quote: QuoteApiItem | ScreenerApiQuote,
  latestPrice: number | null,
  previousClose: number | null
) => {
  const change = toNumber(quote.regularMarketChange)

  if (change !== null) {
    return change
  }

  if (latestPrice !== null && previousClose !== null) {
    return latestPrice - previousClose
  }

  return null
}

const getChangePercentValue = (
  quote: QuoteApiItem | ScreenerApiQuote,
  change: number | null,
  previousClose: number | null
) => {
  const changePercent = toNumber(quote.regularMarketChangePercent)

  if (changePercent !== null) {
    return changePercent
  }

  if (change !== null && previousClose !== null && previousClose !== 0) {
    return (change / previousClose) * 100
  }

  return null
}

const toOverviewStockCard = (quote: OverviewQuote): StockCardData => ({
  symbol: quote.symbol,
  name: quote.name,
  mcap: formatMarketCapLabel(quote.marketCap),
  price: quote.latestPrice,
  change: quote.changePercent,
  sparkline: quote.history
})

const toMoverStockCard = (quote: MoverQuote): StockCardData => ({
  symbol: quote.symbol,
  name: quote.name,
  mcap: formatMarketCapLabel(quote.marketCap),
  price: quote.latestPrice,
  change: quote.changePercent,
  sparkline: EMPTY_HISTORY
})

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

export const Content = ({ page }: ContentProps) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const quoteAnimatedRef = useRef(false)
  const moversAnimatedRef = useRef(false)
  const [quotes, setQuotes] = useState<OverviewQuote[]>([])
  const [quoteStatus, setQuoteStatus] = useState<AsyncStatus>('loading')
  const [quoteError, setQuoteError] = useState<string | null>(null)
  const [moverSections, setMoverSections] = useState<MoverSection[]>([])
  const [moversStatus, setMoversStatus] = useState<AsyncStatus>('loading')
  const [moversError, setMoversError] = useState<string | null>(null)
  const [requestKey, setRequestKey] = useState(0)
  const [activeSymbol, setActiveSymbol] = useState('')
  const { setIsOverviewLoaded } = useOverviewPrefetch()
  const isOverviewPage = page === undefined

  useEffect(() => {
    setIsOverviewLoaded(isOverviewPage && quoteStatus === 'ready' && moversStatus === 'ready')
  }, [isOverviewPage, moversStatus, quoteStatus, setIsOverviewLoaded])

  useEffect(() => {
    if (quoteStatus === 'loading') {
      quoteAnimatedRef.current = false
    }
  }, [quoteStatus])

  useEffect(() => {
    if (moversStatus === 'loading') {
      moversAnimatedRef.current = false
    }
  }, [moversStatus])

  useLayoutEffect(() => {
    if (!rootRef.current || !isOverviewPage || quoteStatus !== 'ready' || !activeSymbol || quoteAnimatedRef.current) {
      return
    }

    if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    const ctx = gsap.context(() => {
      const quotePanels = rootRef.current?.querySelectorAll('[data-overview-quote-panel]')
      const etfActions = rootRef.current?.querySelectorAll('[data-overview-etf-actions]')
      const stockCards = rootRef.current?.querySelectorAll('[data-overview-stock-grid] > *')

      const timeline = gsap.timeline({
        defaults: {
          ease: 'power3.out'
        }
      })

      if (quotePanels?.length) {
        timeline.from(quotePanels, {
          x: 28,
          opacity: 0,
          duration: 0.55,
          stagger: 0.12
        })
      }

      if (etfActions?.length) {
        timeline.from(
          etfActions,
          {
            y: 18,
            opacity: 0,
            duration: 0.4,
            stagger: 0.06
          },
          '-=0.28'
        )
      }

      if (stockCards?.length) {
        timeline.from(
          stockCards,
          {
            y: 22,
            opacity: 0,
            duration: 0.45,
            stagger: 0.045
          },
          '-=0.2'
        )
      }
    }, rootRef)

    quoteAnimatedRef.current = true
    return () => ctx.revert()
  }, [activeSymbol, isOverviewPage, quoteStatus])

  useLayoutEffect(() => {
    if (
      !rootRef.current ||
      !isOverviewPage ||
      moversStatus !== 'ready' ||
      moverSections.length === 0 ||
      moversAnimatedRef.current
    ) {
      return
    }

    if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    const ctx = gsap.context(() => {
      const moversHeader = rootRef.current?.querySelectorAll('[data-overview-movers-header]')
      const moverColumns = rootRef.current?.querySelectorAll('[data-overview-mover-column]')
      const moverCards = rootRef.current?.querySelectorAll('[data-overview-mover-column] .glass-panel-hover')

      const timeline = gsap.timeline({
        defaults: {
          ease: 'power3.out'
        }
      })

      if (moversHeader?.length) {
        timeline.from(moversHeader, {
          x: 18,
          opacity: 0,
          duration: 0.45
        })
      }

      if (moverColumns?.length) {
        timeline.from(
          moverColumns,
          {
            y: 24,
            opacity: 0,
            duration: 0.5,
            stagger: 0.1
          },
          '-=0.18'
        )
      }

      if (moverCards?.length) {
        timeline.from(
          moverCards,
          {
            y: 14,
            opacity: 0,
            duration: 0.34,
            stagger: 0.03
          },
          '-=0.28'
        )
      }
    }, rootRef)

    moversAnimatedRef.current = true
    return () => ctx.revert()
  }, [isOverviewPage, moverSections.length, moversStatus])

  useEffect(() => {
    if (page === 'watchlist') {
      return
    }

    const controller = new AbortController()
    const period1 = getOverviewHistoryStart()

    const loadOverview = async () => {
      const [quoteResponse, chartResults] = await Promise.all([
        fetchYf2<QuoteApiItem[]>(
          {
            operation: 'quote',
            symbols: [...OVERVIEW_SYMBOLS],
            options: {
              fields: [
                'symbol',
                'currency',
                'displayName',
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
        Promise.allSettled(
          OVERVIEW_SYMBOLS.map((symbol) =>
            fetchYf2<ChartApiData>(
              {
                operation: 'chart',
                symbol,
                options: {
                  period1,
                  interval: '1d'
                }
              },
              controller.signal
            )
          )
        )
      ])

      const chartBySymbol = new Map<string, ChartApiData>()

      chartResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          chartBySymbol.set(OVERVIEW_SYMBOLS[index], result.value)
        }
      })

      return quoteResponse.map<OverviewQuote>((quote) => {
        const latestPrice = toNumber(quote.regularMarketPrice)
        const previousClose = toNumber(quote.regularMarketPreviousClose)
        const change = getChangeValue(quote, latestPrice, previousClose)
        const changePercent = getChangePercentValue(quote, change, previousClose)

        return {
          symbol: quote.symbol,
          name: getQuoteName(quote),
          currency: quote.currency || 'USD',
          quoteType: quote.quoteType || 'Quote',
          exchange: quote.fullExchangeName || 'Yahoo Finance',
          latestPrice,
          previousClose,
          change,
          changePercent,
          latestUpdate: quote.regularMarketTime ?? null,
          latestSource: quote.quoteSourceName || quote.fullExchangeName || 'Yahoo Finance',
          marketCap: toNumber(quote.marketCap),
          volume: toNumber(quote.regularMarketVolume),
          history: buildHistory(chartBySymbol.get(quote.symbol)?.quotes ?? [])
        }
      })
    }

    const loadMovers = async () => {
      const results = await Promise.allSettled(
        MOVER_SECTION_CONFIG.map(async (section) => {
          const data = await fetchYf2<ScreenerApiData>(
            {
              operation: 'screener',
              query: section.screenerId,
              options: {
                count: MOVER_COUNT
              }
            },
            controller.signal
          )

          return {
            key: section.key,
            title: section.title,
            description: section.description,
            items: data.quotes.slice(0, MOVER_COUNT).map<MoverQuote>((quote) => {
              const latestPrice = toNumber(quote.regularMarketPrice)
              const previousClose = toNumber(quote.regularMarketPreviousClose)
              const change = getChangeValue(quote, latestPrice, previousClose)
              const changePercent = getChangePercentValue(quote, change, previousClose)

              return {
                symbol: quote.symbol,
                name: getScreenerQuoteName(quote),
                currency: quote.currency || 'USD',
                latestPrice,
                changePercent,
                volume: toNumber(quote.regularMarketVolume),
                marketCap: toNumber(quote.marketCap)
              }
            })
          } satisfies MoverSection
        })
      )

      const sections = results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []))

      if (sections.length === 0) {
        const firstError = results.find((result) => result.status === 'rejected')
        throw firstError?.status === 'rejected' ? firstError.reason : new Error('Failed to load stock movers')
      }

      return sections
    }

    const load = async () => {
      setQuoteStatus('loading')
      setQuoteError(null)
      setMoversStatus('loading')
      setMoversError(null)

      const [quoteResult, moversResult] = await Promise.allSettled([loadOverview(), loadMovers()])

      if (controller.signal.aborted) {
        return
      }

      if (quoteResult.status === 'fulfilled') {
        setQuotes(quoteResult.value)
        setActiveSymbol((current) =>
          quoteResult.value.some((quote) => quote.symbol === current) ? current : (quoteResult.value[0]?.symbol ?? '')
        )
        setQuoteStatus('ready')
      } else {
        setQuotes([])
        setQuoteStatus('error')
        setQuoteError(quoteResult.reason instanceof Error ? quoteResult.reason.message : 'Unknown error')
      }

      if (moversResult.status === 'fulfilled') {
        setMoverSections(moversResult.value)
        setMoversStatus('ready')
      } else {
        setMoverSections([])
        setMoversStatus('error')
        setMoversError(moversResult.reason instanceof Error ? moversResult.reason.message : 'Unknown error')
      }
    }

    void load()

    return () => controller.abort()
  }, [page, requestKey])

  if (page === 'watchlist') {
    return (
      <div className='w-full max-w-4xl space-y-4'>
        <p className='text-sm font-mono text-muted-foreground'>Watchlist is not wired yet.</p>
        <div className='rounded-2xl border border-border/50 bg-muted/20 p-6'>
          <PixelGrid animation='checkerboard' color='#AAAAAA' duration={1800} className='h-12 w-12' />
          <p className='mt-4 max-w-md text-sm leading-6 text-muted-foreground'>
            The overview page is now using live Yahoo Finance data. Watchlist can be wired next once you decide whether
            it should reuse these market snapshots or persist a user-specific set.
          </p>
        </div>
      </div>
    )
  }

  const activeQuote = quotes.find((quote) => quote.symbol === activeSymbol) ?? quotes[0] ?? null

  return (
    <div ref={rootRef} className='relative w-full max-w-7xl space-y-8'>
      <div className='hidden md:flex absolute right-1/3 -top-1'>
        <div className='flex items-center p-3 w-16 mr-4 h-10'>
          <button
            type='button'
            onClick={() => startTransition(() => setRequestKey((value) => value + 1))}
            className='inline-flex size-10 aspect-square items-center justify-center rounded-full border border-transparent hover:border-border hover:bg-border/50 hover:text-foreground text-foreground/40 text-xs font-mono transition-colors _hover:bg-muted/40'>
            <Icon name={quoteStatus === 'loading' ? 'spinner-ring' : 'refresh'} className='size-5 rotate-120' />
          </button>
        </div>
      </div>

      {quoteStatus === 'loading' && (
        <div className='rounded-xl border border-border/50 bg-background/70 p-1 md:p-5'>
          <div className='flex items-center justify-between gap-4'>
            <div className='space-y-2'>
              <div className='h-3 w-28 rounded-full bg-muted/60' />
              <div className='h-8 w-40 rounded-full bg-muted/60' />
            </div>
            <PixelGrid animation='snake' color='#AAAAAA' duration={1200} />
          </div>
          <div className='mt-4 h-80'>
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

      {quoteStatus === 'error' && (
        <div className='rounded-xl border border-destructive/30 bg-destructive/5 p-1 md:p-5'>
          <p className='font-medium text-foreground'>Failed to load Yahoo Finance overview</p>
          <p className='mt-1 text-sm text-muted-foreground'>{quoteError}</p>
        </div>
      )}

      {quoteStatus === 'ready' && !activeQuote && (
        <div className='rounded-xl border border-border/50 bg-muted/20 p-1 md:p-5'>
          <p className='font-medium text-foreground'>Yahoo Finance returned no instruments.</p>
          <p className='mt-1 text-sm text-muted-foreground'>
            Check the configured symbols or the upstream response shape.
          </p>
        </div>
      )}

      {quoteStatus === 'ready' && activeQuote && (
        <div className=''>
          <div className='grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.8fr)_20rem]'>
            <div data-overview-quote-panel className='rounded-lg bg-border/2 p-0'>
              <div className='flex gap-4 flex-row items-start justify-between'>
                <div className='space-y-1'>
                  <div className='md:flex items-end gap-2 font-display'>
                    <h2 className='text-2xl md:text-3xl font-semibold tracking-tight text-foreground'>
                      {activeQuote.symbol}
                    </h2>
                    <span className='pb-1 text-sm text-muted-foreground'>{activeQuote.name}</span>
                  </div>
                </div>

                <div className='text-left sm:text-right'>
                  <p className='text-2xl font-display font-semibold text-foreground ticker-font'>
                    {formatPriceValue(activeQuote.latestPrice, activeQuote.currency)}
                  </p>
                  <p
                    className={`text-sm font-display md:text-left text-right ${(activeQuote.changePercent ?? 0) >= 0 ? 'text-foreground' : 'text-slate-500'}`}>
                    {formatPercentValue(activeQuote.changePercent)}
                  </p>
                </div>
              </div>

              <div className='mt-4 h-80'>
                <EvilAreaChart
                  data={activeQuote.history}
                  chartConfig={getPriceChartConfig(
                    `${activeQuote.symbol} close`,
                    (activeQuote.changePercent ?? 0) >= 0
                  )}
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
                    tickFormatter: (value) => formatPrice(Number(value), activeQuote.currency)
                  }}
                />
              </div>
            </div>

            <div data-overview-quote-panel className=''>
              <div className='grid grid-cols-2 gap-2'>
                <div className='rounded-xl bg-background/80 p-3'>
                  <p className='text-[8px] uppercase tracking-[0.18em] text-muted-foreground'>Previous</p>
                  <p className='mt-2 font-display font-medium text-foreground text-sm'>
                    {formatPriceValue(activeQuote.previousClose, activeQuote.currency)}
                  </p>
                </div>
                <div className='rounded-xl bg-border/8 p-3'>
                  <p className='text-[8px] uppercase tracking-[0.18em] text-muted-foreground'>Change</p>
                  <p className='mt-2 font-display font-medium text-foreground text-sm'>
                    {formatPriceValue(activeQuote.change, activeQuote.currency)}
                  </p>
                </div>
                <div className='rounded-xl  bg-border/8 p-3'>
                  <p className='text-[8px] uppercase tracking-[0.18em] text-muted-foreground'>Source</p>
                  <p className='mt-2 font-display font-medium text-foreground text-sm'>{activeQuote.latestSource}</p>
                </div>
                <div className='rounded-xl bg-border/8 p-3'>
                  <p className='text-[8px] uppercase tracking-[0.18em] text-muted-foreground'>Updated</p>
                  <p className='mt-2 text-sm font-medium text-foreground'>
                    {formatUpdateTime(activeQuote.latestUpdate)}
                  </p>
                </div>
              </div>

              <div data-overview-etf-actions className='mt-4 space-y-2'>
                <div className='flex items-center justify-between gap-3 font-display'>
                  <p className='text-muted-foreground text-[10px] uppercase tracking-wide'>ETFs</p>
                  <a
                    href={getExternalQuoteHref(activeQuote.symbol)}
                    target='_blank'
                    rel='noreferrer'
                    className='flex items-center space-x-1 text-primary text-xs transition-colors hover:text-foreground'>
                    <span>Yahoo Finance</span>
                    <Icon name='arrow-right' className='size-3.5 -rotate-25' />
                  </a>
                </div>
                <div className='flex flex-wrap gap-2'>
                  {quotes.map((quote) => (
                    <button
                      key={quote.symbol}
                      type='button'
                      aria-pressed={activeQuote.symbol === quote.symbol}
                      onClick={() => setActiveSymbol(quote.symbol)}
                      className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
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

          <section className='py-12'>
            <div data-overview-stock-grid className='grid grid-cols-1 gap-10 md:grid-cols-2 xl:grid-cols-4'>
              {quotes.map((quote) => {
                const isPositive = (quote.changePercent ?? 0) >= 0

                return (
                  <Stock
                    key={quote.symbol}
                    stock={toOverviewStockCard(quote)}
                    activeStock={activeQuote}
                    setActiveSymbol={setActiveSymbol}
                    isPositive={isPositive}
                  />
                )
              })}
            </div>
          </section>

          <section className='py-12 space-y-8'>
            <div
              data-overview-movers-header
              className='flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between'>
              <h2 className='font-display text-3xl font-semibold tracking-tight text-foreground'>
                Stock <span className='px-3 font-thin opacity-50'>|</span> Movers
              </h2>
            </div>

            {moversStatus === 'loading' && (
              <div className='grid grid-cols-1 gap-3 lg:grid-cols-3'>
                {Array.from({ length: 3 }, (_, index) => (
                  <div key={index} className='rounded-xl bg-border/5 p-4'>
                    <div className='space-y-2'>
                      <div className='h-3 w-20 rounded-full bg-muted/60' />
                      <div className='h-6 w-32 rounded-full bg-muted/60' />
                    </div>
                    <div className='mt-4 space-y-2'>
                      {Array.from({ length: 5 }, (_, row) => (
                        <div key={row} className='h-14 rounded-xl bg-background/70' />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {moversStatus === 'error' && (
              <div className='rounded-2xl border border-border/50 bg-muted/20 p-5'>
                <p className='font-medium text-foreground'>Failed to load stock movers</p>
                <p className='mt-1 text-sm text-muted-foreground'>{moversError}</p>
              </div>
            )}

            {moversStatus === 'ready' && moverSections.length > 0 && (
              <div className='grid grid-cols-1 lg:grid-cols-3 gap-16'>
                {moverSections.map((section) => (
                  <div key={section.key} data-overview-mover-column className='rounded-e-xl bg-border/5'>
                    <div className='flex items-start'>
                      <div className='space-y-0.5'>
                        <h3 className='font-display text-lg font-semibold text-foreground'>{section.title}</h3>
                        <p className='font-display text-muted-foreground text-sm'>{section.description}</p>
                      </div>
                    </div>

                    <div className='mt-4 space-y-0'>
                      {section.items.map((quote) => {
                        const isPositive = (quote.changePercent ?? 0) >= 0

                        return <Stock key={quote.symbol} stock={toMoverStockCard(quote)} isPositive={isPositive} />
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
