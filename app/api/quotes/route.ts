import type { CMCCryptocurrency, CMCListingsResponse, CryptoApiResponse, CryptoQuote } from '@/lib/cmc/types'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const CMC_LISTINGS_URL = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest'
const CMC_QUOTES_URL = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest'
const DEFAULT_LIMIT = 25
const MAX_LIMIT = 100

function mapCmcToQuote(c: CMCCryptocurrency): CryptoQuote {
  return {
    id: c.id,
    rank: c.cmc_rank,
    name: c.name,
    symbol: c.symbol,
    slug: c.slug,
    price: c.quote.USD.price,
    percentChange1h: c.quote.USD.percent_change_1h ?? 0,
    percentChange24h: c.quote.USD.percent_change_24h ?? 0,
    percentChange7d: c.quote.USD.percent_change_7d ?? 0,
    marketCap: c.quote.USD.market_cap ?? 0,
    volume24h: c.quote.USD.volume_24h ?? 0,
    circulatingSupply: c.circulating_supply,
    maxSupply: c.max_supply,
    lastUpdated: c.quote.USD.last_updated,
    tags: c.tags
  }
}

function getLimit(value: string | null) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT
  return Math.min(Math.max(Math.trunc(parsed), 1), MAX_LIMIT)
}

export async function GET(request: NextRequest): Promise<NextResponse<CryptoApiResponse>> {
  const apiKey = process.env.CMC_API_KEY
  const { searchParams } = request.nextUrl
  const limit = getLimit(searchParams.get('limit'))
  const includeNetworkTokens = searchParams.get('includeNetworkTokens') !== 'false'

  if (!apiKey) {
    return NextResponse.json(
      {
        success: false,
        data: [],
        timestamp: new Date().toISOString(),
        error: 'CMC_API_KEY is not configured'
      },
      { status: 500 }
    )
  }

  try {
    const listingsParams = new URLSearchParams({
      start: '1',
      limit: String(limit),
      convert: 'USD',
      sort: 'market_cap',
      sort_dir: 'desc'
    })

    const response = await fetch(`${CMC_LISTINGS_URL}?${listingsParams}`, {
      headers: {
        'X-CMC_PRO_API_KEY': apiKey,
        Accept: 'application/json'
      },
      next: {
        revalidate: 60 // Cache for 60 seconds
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('CoinMarketCap API error:', errorText)
      return NextResponse.json(
        {
          success: false,
          data: [],
          timestamp: new Date().toISOString(),
          error: `CoinMarketCap API returned ${response.status}`
        },
        { status: response.status }
      )
    }

    const cmcData: CMCListingsResponse = await response.json()

    if (cmcData.status.error_code !== 0) {
      return NextResponse.json(
        {
          success: false,
          data: [],
          timestamp: new Date().toISOString(),
          error: cmcData.status.error_message ?? 'Unknown error from CoinMarketCap'
        },
        { status: 400 }
      )
    }

    const quotes: CryptoQuote[] = cmcData.data.map(mapCmcToQuote)
    const haveSymbols = new Set(quotes.map((q) => q.symbol.toUpperCase()))

    // If MATIC is not in the top listings (e.g. for Polygon/Amoy native token USD value),
    // fetch MATIC and POL via quotes/latest and append.
    if (includeNetworkTokens && !haveSymbols.has('MATIC')) {
      try {
        const quotesRes = await fetch(`${CMC_QUOTES_URL}?symbol=MATIC,POL&convert=USD`, {
          headers: {
            'X-CMC_PRO_API_KEY': apiKey,
            Accept: 'application/json'
          },
          next: { revalidate: 60 }
        })
        if (quotesRes.ok) {
          const quotesData: { data?: Record<string, CMCCryptocurrency>; status?: { error_code?: number } } =
            await quotesRes.json()
          if (quotesData.status?.error_code === 0 && quotesData.data && typeof quotesData.data === 'object') {
            for (const c of Object.values(quotesData.data)) {
              if (
                c &&
                typeof c === 'object' &&
                c.symbol &&
                c.quote?.USD?.price != null &&
                !haveSymbols.has(String(c.symbol).toUpperCase())
              ) {
                quotes.push(mapCmcToQuote(c))
                haveSymbols.add(String(c.symbol).toUpperCase())
              }
            }
          }
        }
      } catch {
        // Non-fatal: continue without MATIC/POL; native token USD value may be missing on Polygon/Amoy
      }
    }

    return NextResponse.json({
      success: true,
      data: quotes,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching crypto quotes:', error)
    return NextResponse.json(
      {
        success: false,
        data: [],
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Failed to fetch cryptocurrency data'
      },
      { status: 500 }
    )
  }
}
