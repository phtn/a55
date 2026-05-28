import type { LobbyHistories, LobbyHistoryEntry } from '@/lib/roulette/types'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

interface StoredLobbyHistories {
  data: LobbyHistories
  receivedAt: string
}

let latestLobbyHistories: StoredLobbyHistories | null = null

const responseHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'no-store'
}

const jsonResponse = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: responseHeaders
  })

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const toFiniteNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return null
}

const normalizeHistoryEntry = (value: unknown): LobbyHistoryEntry | null => {
  if (!isRecord(value) || typeof value.tableId !== 'string') {
    return null
  }

  if (!Array.isArray(value.numbers)) {
    return null
  }

  const numbers = value.numbers
    .map((number) => toFiniteNumber(number))
    .filter((number): number is number => number !== null)

  if (numbers.length !== value.numbers.length) {
    return null
  }

  return {
    tableId: value.tableId,
    numbers
  }
}

const normalizeHistories = (value: unknown): LobbyHistoryEntry[] | null => {
  if (Array.isArray(value)) {
    const entries = value
      .map((entry) => normalizeHistoryEntry(entry))
      .filter((entry): entry is LobbyHistoryEntry => entry !== null)

    return entries.length === value.length ? entries : null
  }

  const singleEntry = normalizeHistoryEntry(value)
  return singleEntry ? [singleEntry] : null
}

const normalizeLobbyHistories = (value: unknown): { data: LobbyHistories | null; error?: string } => {
  if (!isRecord(value)) {
    return { data: null, error: 'Request body must be a JSON object' }
  }

  if (value.type !== 'roulette.lobbyHistories') {
    return { data: null, error: 'type must be roulette.lobbyHistories' }
  }

  const schemaVersion = toFiniteNumber(value.schemaVersion)
  if (schemaVersion !== 1) {
    return { data: null, error: 'schemaVersion must be 1' }
  }

  if (typeof value.emittedAt !== 'string') {
    return { data: null, error: 'emittedAt must be a string' }
  }

  if (typeof value.capturedAt !== 'string') {
    return { data: null, error: 'capturedAt must be a string' }
  }

  if (typeof value.pageUrl !== 'string') {
    return { data: null, error: 'pageUrl must be a string' }
  }

  const captureUrl = typeof value.captureUrl === 'string' ? value.captureUrl : value.pageUrl

  const histories = normalizeHistories(value.histories)
  if (!histories) {
    return {
      data: null,
      error: 'histories must be a history object or array of history objects with tableId and numeric numbers'
    }
  }

  return {
    data: {
      type: 'roulette.lobbyHistories',
      schemaVersion: 1,
      emittedAt: value.emittedAt,
      capturedAt: value.capturedAt,
      pageUrl: value.pageUrl,
      captureUrl,
      histories
    }
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: responseHeaders
  })
}

export async function POST(req: NextRequest) {
  try {
    const text = await req.text()
    if (!text || text.trim() === '') {
      return jsonResponse(
        {
          success: false,
          error: 'Request body is empty'
        },
        400
      )
    }

    let payload: unknown
    try {
      payload = JSON.parse(text)
    } catch (parseError) {
      console.error('Failed to parse lobby histories JSON:', parseError)
      return jsonResponse(
        {
          success: false,
          error: 'Invalid JSON in request body'
        },
        400
      )
    }

    const normalized = normalizeLobbyHistories(payload)
    if (!normalized.data) {
      return jsonResponse(
        {
          success: false,
          error: normalized.error ?? 'Request body does not match the LobbyHistories schema'
        },
        400
      )
    }

    latestLobbyHistories = {
      data: normalized.data,
      receivedAt: new Date().toISOString()
    }

    console.log(
      'Lobby histories received:',
      latestLobbyHistories.data.histories.length,
      latestLobbyHistories.data.histories.map((history) => history.tableId).join(', ')
    )

    return jsonResponse({
      success: true,
      message: 'Lobby histories received',
      data: latestLobbyHistories.data,
      receivedAt: latestLobbyHistories.receivedAt
    })
  } catch (error) {
    console.error('Error processing lobby histories:', error)

    return jsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      400
    )
  }
}

export async function GET() {
  try {
    return jsonResponse({
      success: true,
      hasData: latestLobbyHistories !== null,
      data: latestLobbyHistories?.data ?? null,
      receivedAt: latestLobbyHistories?.receivedAt ?? null
    })
  } catch (error) {
    console.error('Error retrieving lobby histories:', error)

    return jsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      500
    )
  }
}
