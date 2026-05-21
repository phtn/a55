export interface LobbyHistoryEntry {
  tableId: string
  numbers: number[]
}

export interface LobbyHistories {
  type: 'roulette.lobbyHistories'
  schemaVersion: 1
  emittedAt: string
  capturedAt: string
  pageUrl: string
  captureUrl: string
  histories: LobbyHistoryEntry[]
}
