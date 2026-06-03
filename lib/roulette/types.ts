import { BetResult } from '@/types/bets'

export interface BetsResponse {
  success: boolean
  hasData?: boolean
  message?: string
  receivedAt?: string
  data?: BetResult | string
}

export interface TableNode {
  title: string
  data: Record<string, unknown>
}

export type Tone = 'good' | 'bad' | 'warn' | 'info' | 'neutral'

export interface StatTile {
  label: string
  value: string
  detail: string
  tone: Tone
}
export interface LobbyHistoryEntry {
  tableId: string
  numbers: number[]
}

export interface LobbyHistories {
  readonly type: 'roulette.lobbyHistories'
  readonly schemaVersion: 1
  emittedAt: string
  capturedAt: string
  pageUrl: string
  captureUrl: string
  histories: LobbyHistoryEntry[]
}
export interface LobbyHistoriesResponse {
  success: boolean
  hasData?: boolean
  data?: LobbyHistories | null
  receivedAt?: string | null
  error?: string
}

export type EvoTableGameState =
  | 'GAME_RESOLVED'
  | 'BETS_OPEN'
  | 'BETS_CLOSED'
  | 'BETS_CLOSING_SOON'
  | 'BETS_CLOSED_ANNOUNCED'
