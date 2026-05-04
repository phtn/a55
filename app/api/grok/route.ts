import {
  GrokipediaInputError,
  GrokipediaNotFoundError,
  GrokipediaUpstreamError,
  loadGrokipediaArticleLead,
  type GrokipediaRequest
} from '@/lib/grokipedia'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store'
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const readOptionalString = (value: unknown, field: string) => {
  if (value === undefined || value === null) {
    return undefined
  }

  if (typeof value !== 'string') {
    throw new GrokipediaInputError(`\`${field}\` must be a string.`)
  }

  const normalized = value.trim()
  return normalized ? normalized : undefined
}

const parseGetRequest = (request: NextRequest): GrokipediaRequest => {
  const searchParams = request.nextUrl.searchParams

  return {
    page: readOptionalString(searchParams.get('page'), 'page'),
    query: readOptionalString(searchParams.get('query'), 'query'),
    url: readOptionalString(searchParams.get('url'), 'url')
  }
}

const parsePostBody = (body: unknown): GrokipediaRequest => {
  if (!isRecord(body)) {
    throw new GrokipediaInputError('Request body must be a JSON object.')
  }

  return {
    page: readOptionalString(body.page, 'page'),
    query: readOptionalString(body.query, 'query'),
    url: readOptionalString(body.url, 'url')
  }
}

const createErrorResponse = (error: unknown) => {
  if (error instanceof GrokipediaInputError) {
    return NextResponse.json({ error: error.message }, { status: 400, headers: NO_STORE_HEADERS })
  }

  if (error instanceof GrokipediaNotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404, headers: NO_STORE_HEADERS })
  }

  if (error instanceof GrokipediaUpstreamError) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode, headers: NO_STORE_HEADERS })
  }

  const message = error instanceof Error ? error.message : 'Unknown upstream error.'

  console.error('[api/grok]', error)

  return NextResponse.json({ error: message }, { status: 502, headers: NO_STORE_HEADERS })
}

const handleRequest = async (resolveRequest: () => Promise<GrokipediaRequest> | GrokipediaRequest) => {
  try {
    const grokRequest = await resolveRequest()
    const data = await loadGrokipediaArticleLead(grokRequest)

    return NextResponse.json(data, { headers: NO_STORE_HEADERS })
  } catch (error) {
    return createErrorResponse(error)
  }
}

export const GET = async (request: NextRequest) => handleRequest(() => parseGetRequest(request))

export const POST = async (request: NextRequest) =>
  handleRequest(async () => {
    try {
      return parsePostBody(await request.json())
    } catch (error) {
      if (error instanceof GrokipediaInputError) {
        throw error
      }

      throw new GrokipediaInputError('Request body must be valid JSON.')
    }
  })
