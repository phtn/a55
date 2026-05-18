import { getQuote } from '@/lib/yf2'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store'
}

const SUPPORTED_PAIRS = {
  'PHP-USD': {
    symbol: 'PHP=X',
    invert: true
  },
  'USD-PHP': {
    symbol: 'PHP=X',
    invert: false
  }
} as const

interface ExchangeRateApiSuccessResponse {
  success: true
  data: {
    base: string
    quote: string
    rate: number
    sourceSymbol: string
    lastUpdated: string | null
  }
  timestamp: string
}

interface ExchangeRateApiErrorResponse {
  success: false
  data: null
  timestamp: string
  error: string
}

const normalizeCurrency = (value: string | null, fallback: string) => {
  const normalized = value?.trim().toUpperCase()
  return normalized || fallback
}

const createErrorResponse = (status: number, error: string) =>
  NextResponse.json<ExchangeRateApiErrorResponse>(
    {
      success: false,
      data: null,
      timestamp: new Date().toISOString(),
      error
    },
    {
      status,
      headers: NO_STORE_HEADERS
    }
  )

export async function GET(
  request: NextRequest
): Promise<NextResponse<ExchangeRateApiSuccessResponse | ExchangeRateApiErrorResponse>> {
  const { searchParams } = request.nextUrl
  const base = normalizeCurrency(searchParams.get('base'), 'PHP')
  const quote = normalizeCurrency(searchParams.get('quote'), 'USD')
  const pairKey = `${base}-${quote}` as keyof typeof SUPPORTED_PAIRS
  const pairConfig = SUPPORTED_PAIRS[pairKey]

  if (!pairConfig) {
    return createErrorResponse(400, `Unsupported currency pair: ${base}/${quote}`)
  }

  try {
    const quoteData = await getQuote(pairConfig.symbol, undefined, { validateResult: false })
    const marketPrice = Number(quoteData.regularMarketPrice ?? quoteData.bid ?? quoteData.ask)

    if (!Number.isFinite(marketPrice) || marketPrice <= 0) {
      return createErrorResponse(502, `No valid market price returned for ${pairConfig.symbol}`)
    }

    const rate = pairConfig.invert ? 1 / marketPrice : marketPrice
    const regularMarketTime =
      typeof quoteData.regularMarketTime === 'number'
        ? new Date(quoteData.regularMarketTime * 1000).toISOString()
        : null

    return NextResponse.json<ExchangeRateApiSuccessResponse>(
      {
        success: true,
        data: {
          base,
          quote,
          rate,
          sourceSymbol: pairConfig.symbol,
          lastUpdated: regularMarketTime
        },
        timestamp: new Date().toISOString()
      },
      {
        headers: NO_STORE_HEADERS
      }
    )
  } catch (error) {
    console.error('[api/exchange-rate]', error)
    return createErrorResponse(502, error instanceof Error ? error.message : 'Failed to fetch exchange rate')
  }
}
