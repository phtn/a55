import type { NextApiRequest, NextApiResponse } from 'next'
import type { Movers } from '@/lib/tikr/types'
import { getTikrRouteErrorResponse, loadMoversData } from '@/lib/tikr/server'

export default async function handler(req: NextApiRequest, res: NextApiResponse<Movers | { error: string }>) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  }

  try {
    const data = await loadMoversData()
    return res.status(200).json(data)
  } catch (error) {
    const { error: message, statusCode } = getTikrRouteErrorResponse(error)
    return res.status(statusCode).json({ error: message })
  }
}
