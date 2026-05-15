import { NextResponse, type NextRequest } from 'next/server'

export const runtime = 'nodejs'

type SessionBody = {
  idToken?: unknown
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store'
    }
  })
}

export async function POST(request: NextRequest) {
  const body: SessionBody = await request.json()
  const { idToken } = body

  if (!idToken) {
    return jsonResponse({ error: 'idToken is required' }, 400)
  }

  return jsonResponse({ data: null })
}
