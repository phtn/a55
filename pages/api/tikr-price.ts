import type { NextApiRequest, NextApiResponse } from 'next'
import type { StockPricePayload, StockPriceResponse } from '@/lib/tikr/types'
import { getTikrRouteErrorResponse, loadStockPriceData } from '@/lib/tikr/server'

type StockPriceRequestBody = Omit<StockPricePayload, 'auth'>

const parseBody = (body: NextApiRequest['body']): Partial<StockPriceRequestBody> => {
  if (!body) {
    return {}
  }

  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as Partial<StockPriceRequestBody>
    } catch {
      return {}
    }
  }

  if (typeof body === 'object') {
    return body as Partial<StockPriceRequestBody>
  }

  return {}
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StockPriceResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  }

  const body = parseBody(req.body)
  const cid = toNumber(body.cid)
  const tid = toNumber(body.tid)
  const currency = toNumber(body.currency) ?? 160
  const v = typeof body.v === 'string' && body.v.trim() !== '' ? body.v.trim() : 'v1'

  if (!cid || !tid) {
    return res.status(400).json({ error: 'cid and tid are required' })
  }

  try {
    const data = await loadStockPriceData({
      cid,
      tid,
      currency,
      v
    })

    return res.status(200).json(data)
  } catch (error) {
    const { error: message, statusCode } = getTikrRouteErrorResponse(error)
    return res.status(statusCode).json({ error: message })
  }
}
