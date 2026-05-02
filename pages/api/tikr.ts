import type { NextApiRequest, NextApiResponse } from 'next'
import type { ETF, LastQuotePayload, TikrEndpoint } from '@/lib/tikr/types'

const DEFAULT_TIKR_BASE_URL = 'https://api.tikr.com'

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

const isETF = (value: unknown): value is ETF => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const maybeEtf = value as Partial<ETF>
  return Array.isArray(maybeEtf.last)
}

const resolveTikrBaseUrl = () => {
  const configuredBaseUrl = process.env.TIKR_BASEURL?.trim() || DEFAULT_TIKR_BASE_URL

  try {
    const url = new URL(configuredBaseUrl)

    if (url.hostname === 'app.tikr.com') {
      url.hostname = 'api.tikr.com'
    }

    return url.toString().replace(/\/+$/, '')
  } catch {
    throw new Error('Invalid TIKR_BASEURL')
  }
}

const loadTikrData = async (): Promise<ETF> => {
  const authToken = process.env.TIKR_AUTH_TOKEN

  if (!authToken) {
    throw new Error('Missing TIKR_AUTH_TOKEN')
  }

  const lastQuoteEndpoint: TikrEndpoint = 'lastquote_it'
  const baseUrl = resolveTikrBaseUrl()
  const tikrUrl = `${baseUrl.replace(/\/+$/, '')}/${lastQuoteEndpoint}`

  const payload: LastQuotePayload = {
    auth: authToken,
    fetchType: 'init',
    ids: defaultLastQuoteIds
  }

  const response = await fetch(tikrUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const responseText = await response.text()
    throw new Error(responseText || `Failed to fetch last quote (${response.status})`)
  }

  const data: unknown = await response.json()
  if (!isETF(data)) {
    throw new Error('Unexpected TIKR response shape')
  }

  return data
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ETF | { error: string }>) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  }

  try {
    const data = await loadTikrData()
    return res.status(200).json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const statusCode = message.includes('Missing TIKR_') || message === 'Invalid TIKR_BASEURL' ? 500 : 502
    return res.status(statusCode).json({ error: message })
  }
}
