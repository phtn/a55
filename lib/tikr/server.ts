import type {
  ETF,
  LastQuotePayload,
  Movers,
  OverviewPayload,
  StockPricePayload,
  StockPriceResponse,
  TikrEndpoint
} from '@/lib/tikr/types'

const DEFAULT_TIKR_BASE_URL = 'https://api.tikr.com'
const DEFAULT_MOVERS_TYPE = 'stocks'
const DEFAULT_STOCK_PRICE_CURRENCY = 160
const DEFAULT_STOCK_PRICE_VERSION = 'v1'
const TOKEN_EXPIRY_SKEW_SECONDS = 30

const defaultLastQuoteIds: LastQuotePayload['ids'] = [
  {
    cid: 6160262,
    tid: 6179710
  },
  {
    cid: 8108558,
    tid: 37284618
  },
  {
    cid: 6184218,
    tid: 6179254
  },
  {
    cid: 8797658,
    tid: 6179419
  }
]

export class TikrRouteError extends Error {
  constructor(
    message: string,
    readonly statusCode: number
  ) {
    super(message)
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object'

const isETF = (value: unknown): value is ETF =>
  isRecord(value) && Array.isArray((value as Partial<ETF>).last)

const isMoversResponse = (
  value: unknown
): value is Omit<Movers, 'overview'> & {
  overview?: Movers['overview']
} =>
  isRecord(value) &&
  Array.isArray((value as Partial<Movers>).active) &&
  Array.isArray((value as Partial<Movers>).gainers) &&
  Array.isArray((value as Partial<Movers>).losers) &&
  ((value as Partial<Movers>).overview === undefined || Array.isArray((value as Partial<Movers>).overview))

const isStockPriceResponse = (value: unknown): value is StockPriceResponse =>
  isRecord(value) &&
  typeof (value as Partial<StockPriceResponse>).numPrice === 'number' &&
  typeof (value as Partial<StockPriceResponse>).isoCode === 'string' &&
  Array.isArray((value as Partial<StockPriceResponse>).price) &&
  Array.isArray((value as Partial<StockPriceResponse>).company) &&
  Array.isArray((value as Partial<StockPriceResponse>).fin) &&
  isRecord((value as Partial<StockPriceResponse>).last)

const resolveTikrBaseUrl = () => {
  const configuredBaseUrl = process.env.TIKR_BASEURL?.trim() || DEFAULT_TIKR_BASE_URL

  try {
    const url = new URL(configuredBaseUrl)

    if (url.hostname === 'app.tikr.com') {
      url.hostname = 'api.tikr.com'
    }

    return url.toString().replace(/\/+$/, '')
  } catch {
    throw new TikrRouteError('Invalid TIKR_BASEURL', 500)
  }
}

const readTokenExpiry = (token: string) => {
  try {
    const [, payload] = token.split('.')

    if (!payload) {
      return null
    }

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { exp?: unknown }
    return typeof decoded.exp === 'number' ? decoded.exp : null
  } catch {
    return null
  }
}

const getAuthToken = () => {
  const authToken = process.env.TIKR_AUTH_TOKEN

  if (!authToken) {
    throw new TikrRouteError('Missing TIKR_AUTH_TOKEN', 500)
  }

  const tokenExpiry = readTokenExpiry(authToken)
  const now = Math.floor(Date.now() / 1000)

  if (tokenExpiry && tokenExpiry <= now + TOKEN_EXPIRY_SKEW_SECONDS) {
    throw new TikrRouteError('TIKR_AUTH_TOKEN has expired. Refresh it from Tikr and restart the dev server.', 500)
  }

  return authToken
}

const postTikrJson = async (
  endpoint: TikrEndpoint,
  payload: LastQuotePayload | OverviewPayload | StockPricePayload
) => {
  const baseUrl = resolveTikrBaseUrl()
  const tikrUrl = `${baseUrl}/${endpoint}`

  const response = await fetch(tikrUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const responseText = await response.text()
    throw new TikrRouteError(`Tikr upstream error ${response.status}: ${responseText || 'Unknown upstream error'}`, 502)
  }

  return (await response.json()) as unknown
}

export const loadLastQuoteData = async (): Promise<ETF> => {
  const payload: LastQuotePayload = {
    auth: getAuthToken(),
    fetchType: 'init',
    ids: defaultLastQuoteIds
  }

  const data = await postTikrJson('lastquote_it', payload)

  if (!isETF(data)) {
    throw new TikrRouteError('Unexpected TIKR lastquote_it response shape', 502)
  }

  return data
}

export const loadMoversData = async (): Promise<Movers> => {
  const payload: OverviewPayload = {
    auth: getAuthToken(),
    type: process.env.TIKR_MOVERS_TYPE?.trim() || DEFAULT_MOVERS_TYPE
  }

  const data = await postTikrJson('overview_it', payload)

  if (!isMoversResponse(data)) {
    throw new TikrRouteError('Unexpected TIKR overview_it response shape', 502)
  }

  return {
    ...data,
    overview: data.overview ?? []
  }
}

export const loadStockPriceData = async ({
  cid,
  tid,
  currency = DEFAULT_STOCK_PRICE_CURRENCY,
  v = DEFAULT_STOCK_PRICE_VERSION
}: Omit<StockPricePayload, 'auth'>): Promise<StockPriceResponse> => {
  const payload: StockPricePayload = {
    auth: getAuthToken(),
    cid,
    tid,
    currency,
    v
  }

  const data = await postTikrJson('price', payload)

  if (!isStockPriceResponse(data)) {
    throw new TikrRouteError('Unexpected TIKR price response shape', 502)
  }

  return data
}

export const getTikrRouteErrorResponse = (error: unknown) => ({
  error: error instanceof Error ? error.message : 'Unknown error',
  statusCode: error instanceof TikrRouteError ? error.statusCode : 502
})
