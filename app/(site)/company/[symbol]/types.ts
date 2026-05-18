export type AsyncStatus = 'loading' | 'ready' | 'error'

export type OptionalAsyncStatus = AsyncStatus | 'idle'

export type PriceHistoryPoint = {
  date: string
  label: string
  close: number
  volume: number
}

export interface Yf2Response<T> {
  operation: string
  data: T
}

export interface Yf2RequestBody {
  operation: string
  symbol: string
  options?: Record<string, unknown>
}

export interface CompanyQuoteApi {
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

export interface CompanyChartApiQuote {
  date: string
  close: number | null
  volume: number | null
}

export interface CompanyChartApiData {
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

export interface CompanySummaryPrice {
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

export interface CompanySummaryDetail {
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

export interface CompanyDefaultKeyStatistics {
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

export interface CompanyFinancialData {
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

export interface CompanyAssetProfile {
  sector?: string
  industry?: string
  website?: string
  fullTimeEmployees?: number
  longBusinessSummary?: string
}

export interface CompanyEarningsItem {
  date: string
  fiscalQuarter?: string
  revenue?: number
  earnings?: number
  profitMargin?: number
}

export interface CompanyEarningsSummary {
  financialsChart?: {
    quarterly?: CompanyEarningsItem[]
  }
}

export interface CompanySummaryApi {
  price?: CompanySummaryPrice
  summaryDetail?: CompanySummaryDetail
  defaultKeyStatistics?: CompanyDefaultKeyStatistics
  financialData?: CompanyFinancialData
  assetProfile?: CompanyAssetProfile
  earnings?: CompanyEarningsSummary
}

export interface CompanyRecommendationsApi {
  symbol: string
  recommendedSymbols: {
    symbol: string
    score: number
  }[]
}

export interface CompanyPageData {
  quote: CompanyQuoteApi
  chart: CompanyChartApiData
  summary: CompanySummaryApi
  recommendations: CompanyRecommendationsApi | null
}

export interface GrokProfileApiData {
  title: string | null
  factChecked: string | null
  leadHtml: string
  leadText: string
}

export interface GrokProfileApiResponse {
  page: string
  url: string
  data: GrokProfileApiData
}

export interface CompanyPriceClientProps {
  symbol: string
}

export type FinancialMetric = {
  label: string
  value: string
}

export type GrokCacheEntry = {
  error: string | null
  profile: GrokProfileApiResponse | null
  status: OptionalAsyncStatus
}
