'use client'

const GLOBAL_MARKET_CONFIG = [
  {
    region: 'Americas',
    markets: [
      { symbol: '^GSPC', name: 'S&P 500', location: 'US' },
      { symbol: '^IXIC', name: 'NASDAQ', location: 'US' },
      { symbol: '^DJI', name: 'DOW', location: 'US' },
      { symbol: '^GSPTSE', name: 'TSX', location: 'CA' },
      { symbol: '^BVSP', name: 'BOVESPA', location: 'BR' }
    ]
  },
  {
    region: 'Europe',
    markets: [
      { symbol: '^FTSE', name: 'FTSE 100', location: 'UK' },
      { symbol: '^GDAXI', name: 'DAX', location: 'DE' },
      { symbol: '^FCHI', name: 'CAC 40', location: 'FR' },
      { symbol: '^STOXX50E', name: 'STOXX 50', location: 'EU' }
    ]
  },
  {
    region: 'Asia Pacific',
    markets: [
      { symbol: '^N225', name: 'NIKKEI 225', location: 'JP' },
      { symbol: '^HSI', name: 'HANG SENG', location: 'HK' },
      { symbol: '000001.SS', name: 'SHANGHAI', location: 'CN' },
      { symbol: '^AXJO', name: 'ASX 200', location: 'AU' },
      { symbol: '^KS11', name: 'KOSPI', location: 'KR' }
    ]
  }
] as const

const COMMODITY_CONFIG = [
  { symbol: 'GC=F', name: 'Gold', unit: 'oz' },
  { symbol: 'SI=F', name: 'Silver', unit: 'oz' },
  { symbol: 'HG=F', name: 'Copper', unit: 'lb' },
  { symbol: 'NG=F', name: 'Natural Gas', unit: 'MMBtu' },
  { symbol: 'CL=F', name: 'Crude Oil (WTI)', unit: 'bbl' }
] as const

const QUOTE_FIELDS = [
  'symbol',
  'currency',
  'shortName',
  'longName',
  'quoteType',
  'marketState',
  'regularMarketPrice',
  'regularMarketPreviousClose',
  'regularMarketChange',
  'regularMarketChangePercent'
] as const

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
  moduleOptions?: {
    validateResult?: boolean
  }
}

interface QuoteApiItem {
  symbol: string
  currency?: string
  shortName?: string
  longName?: string
  quoteType?: string
  marketState?: 'REGULAR' | 'CLOSED' | 'PRE' | 'PREPRE' | 'POST' | 'POSTPOST'
  regularMarketPrice?: number
  regularMarketPreviousClose?: number
  regularMarketChange?: number
  regularMarketChangePercent?: number
}

export interface MarketCardData {
  change: number | null
  location: string
  name: string
  status: 'open' | 'closed'
  symbol: string
  value: number | null
}

export interface CommodityCardData {
  change: number | null
  name: string
  price: number | null
  symbol: string
  unit: string
}

export interface MarketsPageData {
  commodities: CommodityCardData[]
  markets: {
    region: string
    markets: MarketCardData[]
  }[]
}

let marketsDataCache: MarketsPageData | null = null
let marketsDataPromiseCache: Promise<MarketsPageData> | null = null

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

const getChangePercentValue = (quote: QuoteApiItem) => {
  const direct = toNumber(quote.regularMarketChangePercent)

  if (direct !== null) {
    return direct
  }

  const latestPrice = toNumber(quote.regularMarketPrice)
  const previousClose = toNumber(quote.regularMarketPreviousClose)

  if (latestPrice !== null && previousClose !== null && previousClose !== 0) {
    return ((latestPrice - previousClose) / previousClose) * 100
  }

  return null
}

const getMarketStatus = (marketState: QuoteApiItem['marketState']): 'open' | 'closed' =>
  marketState === 'REGULAR' ? 'open' : 'closed'

const fetchMarketsData = async () => {
  const marketSymbols = GLOBAL_MARKET_CONFIG.flatMap((region) => region.markets.map((market) => market.symbol))
  const commoditySymbols = COMMODITY_CONFIG.map((commodity) => commodity.symbol)

  const [marketQuotes, commodityQuotes] = await Promise.all([
    fetchYf2<QuoteApiItem[]>({
      operation: 'quote',
      symbols: marketSymbols,
      options: {
        fields: QUOTE_FIELDS
      }
    }),
    fetchYf2<QuoteApiItem[]>({
      operation: 'quote',
      symbols: commoditySymbols,
      options: {
        fields: QUOTE_FIELDS
      },
      moduleOptions: {
        validateResult: false
      }
    })
  ])

  const quotes = [...marketQuotes, ...commodityQuotes]
  const quotesBySymbol = new Map(quotes.map((quote) => [quote.symbol, quote]))

  return {
    markets: GLOBAL_MARKET_CONFIG.map((region) => ({
      region: region.region,
      markets: region.markets.map((market) => {
        const quote = quotesBySymbol.get(market.symbol)

        return {
          symbol: market.symbol,
          name: market.name,
          location: market.location,
          value: toNumber(quote?.regularMarketPrice),
          change: quote ? getChangePercentValue(quote) : null,
          status: getMarketStatus(quote?.marketState)
        }
      })
    })),
    commodities: COMMODITY_CONFIG.map((commodity) => {
      const quote = quotesBySymbol.get(commodity.symbol)

      return {
        symbol: commodity.symbol,
        name: commodity.name,
        unit: commodity.unit,
        price: toNumber(quote?.regularMarketPrice),
        change: quote ? getChangePercentValue(quote) : null
      }
    })
  } satisfies MarketsPageData
}

export const getCachedMarketsData = () => marketsDataCache

export const loadMarketsData = () => {
  if (marketsDataCache) {
    return Promise.resolve(marketsDataCache)
  }

  if (marketsDataPromiseCache) {
    return marketsDataPromiseCache
  }

  const promise = fetchMarketsData()
    .then((data) => {
      marketsDataCache = data
      return data
    })
    .finally(() => {
      marketsDataPromiseCache = null
    })

  marketsDataPromiseCache = promise
  return promise
}

export const preloadMarketsData = () => {
  if (marketsDataCache || marketsDataPromiseCache) {
    return
  }

  void loadMarketsData().catch(() => {})
}
