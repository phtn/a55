type TableName = string
type DataStore = Record<TableName, number[]>
type ApiPayload = Record<TableName, number[]>[] // <-- array of records

const STORAGE_KEY = 'data_store'
const WINDOW_SIZE = 15
const MAX_HISTORY_PER_TABLE = WINDOW_SIZE * 8

function canUseLocalStorage(): boolean {
  return typeof window !== 'undefined'
}

function normalizeTableName(tableName: TableName): TableName {
  return tableName.toLowerCase()
}

function trimStore(store: DataStore, maxHistoryPerTable = MAX_HISTORY_PER_TABLE): DataStore {
  const trimmedEntries = Object.entries(store).map(([tableName, values]) => [
    normalizeTableName(tableName),
    values.slice(0, maxHistoryPerTable),
  ])

  return Object.fromEntries(trimmedEntries) as DataStore
}

function isQuotaExceededError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  return (
    error.name === 'QuotaExceededError' ||
    error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    error.message.toLowerCase().includes('quota')
  )
}

export function loadStore(): DataStore {
  if (!canUseLocalStorage()) {
    return {}
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as DataStore) : {}
  } catch {
    return {}
  }
}

function saveStore(store: DataStore): void {
  if (!canUseLocalStorage()) {
    return
  }

  let maxHistoryPerTable = MAX_HISTORY_PER_TABLE

  while (maxHistoryPerTable >= WINDOW_SIZE) {
    const trimmedStore = trimStore(store, maxHistoryPerTable)

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedStore))
      return
    } catch (error) {
      if (!isQuotaExceededError(error)) {
        throw error
      }

      if (maxHistoryPerTable === WINDOW_SIZE) {
        console.warn(
          `Skipping persistence for "${STORAGE_KEY}" because the browser storage quota is full`,
        )
        return
      }

      maxHistoryPerTable = Math.max(WINDOW_SIZE, Math.floor(maxHistoryPerTable / 2))
    }
  }
}

export function clearStore(): void {
  if (!canUseLocalStorage()) {
    return
  }

  localStorage.removeItem(STORAGE_KEY)
}

export function removeTableFromStore(tableName: TableName): void {
  const store = loadStore()
  delete store[normalizeTableName(tableName)]
  saveStore(store)
}

function findOverlapLength(stored: number[], incoming: number[]): number {
  const maxOverlap = Math.min(stored.length, incoming.length)
  for (let overlap = maxOverlap; overlap > 0; overlap--) {
    const storedPrefix = stored.slice(0, overlap)
    const incomingSuffix = incoming.slice(incoming.length - overlap)
    if (storedPrefix.every((v, i) => v === incomingSuffix[i])) {
      return overlap
    }
  }
  return 0
}

function mergeIncoming(stored: number[], incoming: number[]): { updated: number[]; newCount: number } {
  if (stored.length === 0) {
    return { updated: [...incoming], newCount: incoming.length }
  }
  const overlapLength = findOverlapLength(stored, incoming)
  const newItems = incoming.slice(0, incoming.length - overlapLength)
  if (newItems.length === 0) {
    return { updated: stored, newCount: 0 }
  }
  return { updated: [...newItems, ...stored], newCount: newItems.length }
}

/**
 * Collapses Record<TableName, number[]>[] into a single Record<TableName, number[]>.
 * If the same table key appears in multiple records, the LAST one wins —
 * since the array is ordered chronologically, the latest window is most recent.
 */
function flattenPayload(payload: ApiPayload): DataStore {
  return payload.reduce<DataStore>((acc, record) => {
    for (const [tableName, values] of Object.entries(record)) {
      acc[normalizeTableName(tableName)] = values
    }

    return acc
  }, {})
}

export function applyApiUpdate(payload: ApiPayload): void {
  const store = loadStore()
  const flattened = flattenPayload(payload)
  let changed = false

  for (const [tableName, incoming] of Object.entries(flattened)) {
    if (incoming.length !== WINDOW_SIZE) {
      console.warn(`Unexpected window size for "${tableName}": ${incoming.length}`)
      continue
    }
    const existing = store[tableName] ?? []
    const { updated, newCount } = mergeIncoming(existing, incoming)
    if (newCount > 0) {
      console.log(`[${tableName}] +${newCount} new item(s) appended`)
    }
    if (
      updated.length !== existing.length ||
      updated.some((value, index) => value !== existing[index])
    ) {
      store[tableName] = updated
      changed = true
    }
  }

  if (changed) {
    saveStore(store)
  }
}

// --- Usage ---
// const payload: ApiPayload = [
//   { prices: [16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2] },
//   { volumes: [99, 88, 77, 66, 55, 44, 33, 22, 11, 9, 8, 7, 6, 5, 4] },
//   { prices: [18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4] }, // later window wins
// ];

// applyApiUpdate(payload);

/*
How the overlap detection works:
The incoming window is always [newItems, ...previousWindowPrefix]. So you scan from the longest possible overlap downward — checking if the first N items of stored match the last N items of incoming. The first match tells you exactly how many items at the front of incoming are genuinely new. Everything else is already in your store.
Edge cases handled:

First-ever load (empty store) → all 15 items stored as-is
Multiple new items per poll (1–15) → all correctly prepended
Completely disjoint window (e.g. after a long gap) → all 15 items added
Unexpected payload size → skipped with a warning, store untouched
*/
