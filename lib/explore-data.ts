'use client'

const TRENDING_REGION = 'US'
const TRENDING_POOL_COUNT = 100
const HISTORY_LOOKBACK_DAYS = 180
const EXPLORE_QUOTE_FIELDS = [
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
] as const
const EXPLORE_SUMMARY_MODULES = ['assetProfile'] as const

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

interface TrendingSymbolsApiData {
  quotes: {
    symbol: string
  }[]
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
  }
  quotes: ChartApiQuote[]
}

interface CompanySummaryApi {
  assetProfile?: {
    sector?: string
    industry?: string
  }
}

export type HistoryPoint = {
  label: string
  price: number
}

export interface ExploreStock {
  symbol: string
  name: string
  mcap?: string
  price: number | null
  change: number | null
  sparkline: { price: number }[]
  currency: string
  exchange: string
  history: HistoryPoint[]
  industry: string
  latestSource: string
  latestUpdate: string | null
  sector: string
}

let exploreDataCache: ExploreStock[] | null = null
let exploreDataPromiseCache: Promise<ExploreStock[]> | null = null

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

const formatCompactNumber = (value: number) =>
  new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: value >= 1_000_000_000 ? 2 : 1
  }).format(value)

const formatHistoryLabel = (value: string) => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

const getQuoteName = (quote: QuoteApiItem) => quote.displayName || quote.shortName || quote.longName || quote.symbol

const formatMarketCapLabel = (value: number | null) => (value === null ? undefined : formatCompactNumber(value))

const buildHistory = (quotes: ChartApiQuote[]) =>
  quotes.reduce<HistoryPoint[]>((history, point) => {
    const price = toNumber(point.close)

    if (price === null) {
      return history
    }

    history.push({
      label: formatHistoryLabel(point.date),
      price
    })

    return history
  }, [])

const getChangePercentValue = (quote: QuoteApiItem, latestPrice: number | null, previousClose: number | null) => {
  const changePercent = toNumber(quote.regularMarketChangePercent)

  if (changePercent !== null) {
    return changePercent
  }

  if (latestPrice !== null && previousClose !== null && previousClose !== 0) {
    return ((latestPrice - previousClose) / previousClose) * 100
  }

  return null
}

const readApiError = async (response: Response, fallbackMessage: string) => {
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    const payload = (await response.json()) as { error?: string }
    return payload.error || fallbackMessage
  }

  return (await response.text()) || fallbackMessage
}

const fetchYf2 = async <T,>(request: Yf2RequestBody) => {
  const response = await fetch('/api/yf2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  })

  if (!response.ok) {
    throw new Error(await readApiError(response, `Failed to load ${request.operation} data`))
  }

  const payload = (await response.json()) as Yf2Response<T>
  return payload.data
}

const fetchExploreData = async () => {
  const trending = await fetchYf2<TrendingSymbolsApiData>({
    operation: 'trendingSymbols',
    query: TRENDING_REGION,
    options: {
      count: TRENDING_POOL_COUNT
    }
  })

  const symbols = Array.from(
    new Set(trending.quotes.map((quote) => quote.symbol.trim().toUpperCase()).filter(Boolean))
  ).slice(0, TRENDING_POOL_COUNT)

  if (symbols.length === 0) {
    return []
  }

  const [quoteResponse, chartResults, summaryResults] = await Promise.all([
    fetchYf2<QuoteApiItem[]>({
      operation: 'quote',
      symbols,
      options: {
        fields: EXPLORE_QUOTE_FIELDS
      }
    }),
    Promise.allSettled(
      symbols.map((symbol) =>
        fetchYf2<ChartApiData>({
          operation: 'chart',
          symbol,
          options: {
            period1: getHistoryStart(),
            interval: '1d'
          }
        })
      )
    ),
    Promise.allSettled(
      symbols.map((symbol) =>
        fetchYf2<CompanySummaryApi>({
          operation: 'quoteSummary',
          symbol,
          options: {
            modules: EXPLORE_SUMMARY_MODULES
          }
        })
      )
    )
  ])

  const chartBySymbol = new Map<string, ChartApiData>()
  const summaryBySymbol = new Map<string, CompanySummaryApi>()

  chartResults.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      chartBySymbol.set(symbols[index], result.value)
    }
  })

  summaryResults.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      summaryBySymbol.set(symbols[index], result.value)
    }
  })

  return quoteResponse
    .filter((quote) => symbols.includes(quote.symbol) && ['EQUITY', 'ETF'].includes(quote.quoteType || ''))
    .sort((a, b) => symbols.indexOf(a.symbol) - symbols.indexOf(b.symbol))
    .map<ExploreStock>((quote) => {
      const latestPrice = toNumber(quote.regularMarketPrice)
      const previousClose = toNumber(quote.regularMarketPreviousClose)
      const changePercent = getChangePercentValue(quote, latestPrice, previousClose)
      const history = buildHistory(chartBySymbol.get(quote.symbol)?.quotes ?? [])
      const assetProfile = summaryBySymbol.get(quote.symbol)?.assetProfile
      const sector = assetProfile?.sector || (quote.quoteType === 'ETF' ? 'ETF' : 'Other')
      const industry = assetProfile?.industry || quote.quoteType || 'N/A'

      return {
        symbol: quote.symbol,
        name: getQuoteName(quote),
        mcap: formatMarketCapLabel(toNumber(quote.marketCap)),
        price: latestPrice,
        change: changePercent,
        sparkline: history.slice(-15),
        currency: quote.currency || 'USD',
        exchange: quote.fullExchangeName || 'Yahoo Finance',
        history,
        industry,
        latestSource: quote.quoteSourceName || quote.fullExchangeName || 'Yahoo Finance',
        latestUpdate: quote.regularMarketTime ?? null,
        sector
      }
    })
}

export const getCachedExploreData = () => exploreDataCache

export const loadExploreData = () => {
  if (exploreDataCache) {
    return Promise.resolve(exploreDataCache)
  }

  if (exploreDataPromiseCache) {
    return exploreDataPromiseCache
  }

  const promise = fetchExploreData()
    .then((stocks) => {
      exploreDataCache = stocks
      return stocks
    })
    .finally(() => {
      exploreDataPromiseCache = null
    })

  exploreDataPromiseCache = promise
  return promise
}

export const preloadExploreData = () => {
  if (exploreDataCache || exploreDataPromiseCache) {
    return
  }

  void loadExploreData().catch(() => {})
}
