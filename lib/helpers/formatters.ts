import { CompanyPageData } from '@/app/(site)/company/[symbol]/types'
import { ChartConfig } from '@/components/evilcharts/ui/chart'

const POSITIVE_CHART_COLOR = 'var(--foreground)'
const NEGATIVE_CHART_COLOR = 'var(--muted-foreground)'
const HISTORY_LOOKBACK_DAYS = 400
const DEFAULT_CURRENCY_CODE = 'USD'

export const getPriceChartConfig = (label: string, positive: boolean) =>
  ({
    close: {
      label,
      colors: {
        light: [positive ? POSITIVE_CHART_COLOR : NEGATIVE_CHART_COLOR],
        dark: [positive ? POSITIVE_CHART_COLOR : NEGATIVE_CHART_COLOR]
      }
    }
  }) satisfies ChartConfig

export const getHistoryStart = () => {
  const start = new Date()
  start.setDate(start.getDate() - HISTORY_LOOKBACK_DAYS)
  return start.toISOString().slice(0, 10)
}

export const normalizeCompanySymbol = (value: string) => value.trim().toUpperCase()

export const getCompanyNameFromData = (data: CompanyPageData, fallbackSymbol: string) =>
  data.quote.longName || data.quote.shortName || data.chart.meta.longName || data.chart.meta.shortName || fallbackSymbol

export const getGrokQueryFromData = (data: CompanyPageData) =>
  data.quote.longName || data.quote.shortName || data.chart.meta.longName || data.chart.meta.shortName || null

export const toNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

export const formatCurrency = (value: number, currencyCode?: string) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode || DEFAULT_CURRENCY_CODE,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)

export const formatSignedCurrency = (value: number) => `${value >= 0 ? '+' : '-'}${formatCurrency(Math.abs(value))}`
export const formatCompactCurrency = (value: number, currencyCode?: string) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode || DEFAULT_CURRENCY_CODE,
    notation: 'compact',
    maximumFractionDigits: value >= 1_000_000_000 ? 2 : 1
  }).format(value)

export const formatCompactNumber = (value: number) =>
  new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: value >= 1_000_000_000 ? 2 : 1
  }).format(value)

export const formatPercentValue = (value: number) => `${value >= 0 ? '' : ''}${value.toFixed(2)}%`

export const formatRatioPercentValue = (value: number) => `${value >= 0 ? '+' : ''}${(value * 100).toFixed(2)}%`

export const formatDateLabel = (value: string) => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

export const formatDateTime = (value: string | null) => {
  if (!value) {
    return 'N/A'
  }
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

export const formatNullableCurrency = (value: number | null, currencyCode: string) =>
  value === null ? 'N/A' : formatCurrency(value, currencyCode)

export const formatNullableCompactCurrency = (value: number | null, currencyCode: string) =>
  value === null ? 'N/A' : formatCompactCurrency(value, currencyCode)

export const formatNullableCompactNumber = (value: number | null) =>
  value === null ? 'N/A' : formatCompactNumber(value)

export const formatNullableRatioPercent = (value: number | null) =>
  value === null ? 'N/A' : formatRatioPercentValue(value)

export const formatNullableDate = (value: string | undefined) => (value ? formatDateTime(value) : 'N/A')

export const formatRecommendation = (value: string | undefined) => {
  if (!value) {
    return ''
  }

  return value.split('_').join(' ')
}
