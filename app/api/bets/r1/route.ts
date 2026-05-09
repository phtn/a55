import { NextRequest, NextResponse } from 'next/server'

interface StoredBetResult {
  data: unknown
  receivedAt: string
}

let latestBetResult: StoredBetResult | null = null

const jsonResponse = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  })

export async function POST(req: NextRequest) {
  try {
    // Check if request has a body
    const contentType = req.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      console.warn('POST request without JSON content-type:', contentType)
      return jsonResponse(
        {
          success: false,
          error: 'Content-Type must be application/json'
        },
        400
      )
    }

    const text = await req.text()
    if (!text || text.trim() === '') {
      console.warn('POST request with empty body')
      return jsonResponse(
        {
          success: false,
          error: 'Request body is empty'
        },
        400
      )
    }

    let results: unknown
    try {
      results = JSON.parse(text)
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError)
      return jsonResponse(
        {
          success: false,
          error: 'Invalid JSON in request body'
        },
        400
      )
    }

    console.log('Results received:', JSON.stringify(results, null, 2))
    latestBetResult = {
      data: results,
      receivedAt: new Date().toISOString()
    }

    // Store the result (only if unique roundId)
    // const storedResult = addGameResult(results)

    if (!results) {
      return jsonResponse(
        {
          success: true,
          message: 'Game results received but skipped (duplicate roundId)',
          ...latestBetResult
        },
      )
    }

    return jsonResponse(
      {
        success: true,
        message: 'Game results received',
        ...latestBetResult
      }
    )
  } catch (error) {
    console.error('Error processing game results:', error)

    return jsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      400
    )
  }
}

// GET endpoint to retrieve stored results
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const since = searchParams.get('since')

    return jsonResponse(
      {
        success: true,
        since,
        hasData: latestBetResult !== null,
        ...latestBetResult
      }
    )
  } catch (error) {
    console.error('Error retrieving game results:', error)

    return jsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      500
    )
  }
}
