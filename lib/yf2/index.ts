import createYahooFinance from 'yahoo-finance2/createYahooFinance'
import {
  chart,
  fundamentalsTimeSeries,
  historical,
  insights,
  options,
  quote,
  quoteSummary,
  recommendationsBySymbol,
  screener,
  search,
  trendingSymbols
} from 'yahoo-finance2/modules'
import type { ChartOptions } from 'yahoo-finance2/modules/chart'
import type { FundamentalsTimeSeriesOptions } from 'yahoo-finance2/modules/fundamentalsTimeSeries'
import type { HistoricalOptions } from 'yahoo-finance2/modules/historical'
import type { InsightsOptions } from 'yahoo-finance2/modules/insights'
import type { OptionsOptions } from 'yahoo-finance2/modules/options'
import type { QuoteOptions } from 'yahoo-finance2/modules/quote'
import type { QuoteSummaryOptions } from 'yahoo-finance2/modules/quoteSummary'
import type { RecommendationsBySymbolOptions } from 'yahoo-finance2/modules/recommendationsBySymbol'
import type { PredefinedScreenerModules, ScreenerOptions } from 'yahoo-finance2/modules/screener'
import type { SearchOptions } from 'yahoo-finance2/modules/search'
import type { TrendingSymbolsOptions } from 'yahoo-finance2/modules/trendingSymbols'

const YahooFinanceClient = createYahooFinance({
  modules: {
    quote,
    search,
    historical,
    fundamentalsTimeSeries,
    chart,
    recommendationsBySymbol,
    quoteSummary,
    trendingSymbols,
    screener,
    insights,
    options
  }
})

export const yahooFinance = new YahooFinanceClient({ suppressNotices: ['yahooSurvey'] })

export const YF2_OPERATIONS = [
  'quote',
  'search',
  'historical',
  'fundamentalsTimeSeries',
  'chart',
  'recommendationsBySymbol',
  'quoteSummary',
  'trendingSymbols',
  'screener',
  'insights',
  'options'
] as const

export type Yf2Operation = (typeof YF2_OPERATIONS)[number]

export interface Yf2Request {
  operation: Yf2Operation
  symbol?: string
  symbols?: string[]
  query?: string
  options?: Record<string, unknown>
}

export class Yf2InputError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'Yf2InputError'
  }
}

export class Yf2NotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'Yf2NotFoundError'
  }
}

const normalizeInput = (value: string) => value.trim()

const normalizeSymbol = (value: string) => normalizeInput(value).toUpperCase()

const normalizeSymbols = (values: string[]) => values.map(normalizeSymbol).filter(Boolean)

const requireValue = (value: string | undefined, label: string) => {
  const normalized = value ? normalizeInput(value) : ''

  if (!normalized) {
    throw new Yf2InputError(`Missing \`${label}\`.`)
  }

  return normalized
}

const requireSymbol = (value: string | undefined) => normalizeSymbol(requireValue(value, 'symbol'))

const requireQuery = (value: string | undefined) => requireValue(value, 'query')

const requireOptions = <T extends object>(value: Record<string, unknown> | undefined, operation: string) => {
  if (!value) {
    throw new Yf2InputError(`Missing \`options\` for \`${operation}\`.`)
  }

  return value as T
}

const requireOptionField = <T extends object, K extends keyof T>(value: T, field: K, operation: string) => {
  const fieldValue = value[field]

  if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
    throw new Yf2InputError(`\`${operation}\` requires \`options.${String(field)}\`.`)
  }

  return fieldValue
}

export const getQuote = async (ticker: string, options?: QuoteOptions) => {
  const symbol = requireSymbol(ticker)
  const quoteData = await yahooFinance.quote(symbol, options)

  if (!quoteData) {
    throw new Yf2NotFoundError(`No quote found for \`${symbol}\`.`)
  }

  return quoteData
}

export const executeYf2Request = async (request: Yf2Request) => {
  switch (request.operation) {
    case 'quote': {
      const quoteOptions = request.options as QuoteOptions | undefined
      const symbols = normalizeSymbols(request.symbols ?? [])

      if (symbols.length > 0) {
        return yahooFinance.quote(symbols, quoteOptions)
      }

      return getQuote(requireSymbol(request.symbol), quoteOptions)
    }

    case 'search':
      return yahooFinance.search(requireQuery(request.query), request.options as SearchOptions | undefined)

    case 'historical': {
      const options = requireOptions<HistoricalOptions>(request.options, 'historical')
      requireOptionField(options, 'period1', 'historical')
      return yahooFinance.historical(requireSymbol(request.symbol), options)
    }

    case 'fundamentalsTimeSeries': {
      const options = requireOptions<FundamentalsTimeSeriesOptions>(request.options, 'fundamentalsTimeSeries')
      requireOptionField(options, 'period1', 'fundamentalsTimeSeries')
      requireOptionField(options, 'module', 'fundamentalsTimeSeries')
      return yahooFinance.fundamentalsTimeSeries(requireSymbol(request.symbol), options)
    }

    case 'chart': {
      const options = requireOptions<ChartOptions>(request.options, 'chart')
      requireOptionField(options, 'period1', 'chart')
      return yahooFinance.chart(requireSymbol(request.symbol), options)
    }

    case 'recommendationsBySymbol': {
      const options = request.options as RecommendationsBySymbolOptions | undefined
      const symbols = normalizeSymbols(request.symbols ?? [])

      if (symbols.length > 0) {
        return yahooFinance.recommendationsBySymbol(symbols, options)
      }

      return yahooFinance.recommendationsBySymbol(requireSymbol(request.symbol), options)
    }

    case 'quoteSummary':
      return yahooFinance.quoteSummary(
        requireSymbol(request.symbol),
        request.options as QuoteSummaryOptions | undefined
      )

    case 'trendingSymbols': {
      const options = request.options as TrendingSymbolsOptions | undefined
      const region = request.query ? normalizeInput(request.query) : options?.region?.trim()

      if (!region) {
        throw new Yf2InputError('`trendingSymbols` requires `query` or `options.region`.')
      }

      return yahooFinance.trendingSymbols(region.toUpperCase(), options)
    }

    case 'screener': {
      const options = request.options as ScreenerOptions | undefined
      const screenId = request.query ? normalizeInput(request.query) : options?.scrIds

      if (!screenId) {
        throw new Yf2InputError('`screener` requires `query` or `options.scrIds`.')
      }

      return yahooFinance.screener(screenId as PredefinedScreenerModules, options, {
        validateResult: false
      })
    }

    case 'insights':
      return yahooFinance.insights(requireSymbol(request.symbol), request.options as InsightsOptions | undefined)

    case 'options':
      return yahooFinance.options(requireSymbol(request.symbol), request.options as OptionsOptions | undefined)
  }
}
