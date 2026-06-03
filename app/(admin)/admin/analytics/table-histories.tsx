import { HyperList } from '@/components/hyperlist'
import { Button } from '@/components/ui/button'
import { Icon } from '@/lib/icons'
import { LobbyHistories } from '@/lib/roulette/types'
import { useEffect, useMemo, useState } from 'react'
import { rtnMap } from './rtn-map'
import { applyApiUpdate, clearStore, loadStore, removeTableFromStore } from './sliding-window'

// === Stable table order (never changes once a table is seen) ===
const TABLE_ORDER_KEY = 'roulette_table_order'

function canUseLocalStorage(): boolean {
  return typeof window !== 'undefined'
}

function loadTableOrder(): string[] {
  if (!canUseLocalStorage()) {
    return []
  }

  try {
    const raw = localStorage.getItem(TABLE_ORDER_KEY)
    const loaded = raw ? (JSON.parse(raw) as string[]) : []
    // Always dedupe on load to prevent corrupted state
    return Array.from(new Set(loaded))
  } catch {
    return []
  }
}

function saveTableOrder(order: string[]): void {
  if (!canUseLocalStorage()) {
    return
  }

  // Always dedupe before persisting
  const normalized = Array.from(new Set(order))
  localStorage.setItem(TABLE_ORDER_KEY, JSON.stringify(normalized))
}

function clearTableOrder(): void {
  if (!canUseLocalStorage()) {
    return
  }

  localStorage.removeItem(TABLE_ORDER_KEY)
}
interface TableHistoriesProps {
  payload: LobbyHistories | null
}
export const TableHistories = ({ payload }: TableHistoriesProps) => {
  const historyItems = useMemo(() => payload?.histories ?? [], [payload])
  const store = loadStore()

  // Stable ordered list of tables (never reorders, only grows)
  const [tableOrder, setTableOrder] = useState<string[]>(() => loadTableOrder())

  // Derive display order from persisted order plus the accumulated store keys.
  const tableIds = useMemo(() => Array.from(new Set([...tableOrder, ...Object.keys(store)])), [store, tableOrder])

  useEffect(() => {
    const livePayload = historyItems.map((entry) => ({
      [entry.tableId]: entry.numbers
    }))

    applyApiUpdate(livePayload)
  }, [historyItems])

  return (
    <div className=''>
      <div className='px-0 rounded-lg border-background dark:border-background'>
        <div className='border-none'>
          <div className='font-poly font-semibold text-lg border-none'>
            <div className='flex items-center space-x-4'>
              <div>
                {tableIds.length > 0 ? `${tableIds.length} Table${tableIds.length === 1 ? '' : 's'}` : 'No table data'}
              </div>
              <div>
                <Button
                  id='reset-all-tables'
                  size='xs'
                  className='text-xs'
                  onClick={() => {
                    // Clear the entire store + order
                    clearStore()
                    clearTableOrder()
                    setTableOrder([])
                  }}>
                  Reset All
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className='space-y-0 p-0 rounded-xs border-none grid 2xl:grid-cols-3 3xl:grid-cols-4'>
          {tableIds.length === 0 ? (
            <div className='p-6 text-sm text-muted-foreground'>No tables have been seen yet.</div>
          ) : (
            tableIds.map((id) => {
              const label = rtnMap[id] ?? id
              const nums = store[id] ?? []

              return (
                <div key={id} className='rounded-xs border-t border-border/50 bg-muted/20 px-4 py-2'>
                  <div className='relative flex flex-wrap items-start justify-between'>
                    <div className='flex items-center space-x-4 py-4'>
                      <p className='font-display font-medium text-base text-foreground'>{label}</p>
                      <p className='font-display font-medium text-foreground text-sm'>{nums.length}</p>
                      <Button
                        id={`reset-${id}`}
                        variant='secondary'
                        size='icon-xs'
                        onClick={() => {
                          // Remove this table from the single store
                          removeTableFromStore(id)

                          // Remove from stable order
                          const newOrder = tableOrder.filter((tableId) => tableId !== id)
                          saveTableOrder(newOrder)
                          setTableOrder(newOrder)
                        }}>
                        <Icon name='close' className='size-3' />
                      </Button>
                    </div>
                  </div>

                  <div className='flex flex-wrap h-36'>
                    {nums.length > 0 ? (
                      <HyperList
                        data={nums.slice(0, 30).map((n) => ({ n }))}
                        component={NumberItem}
                        container='grid grid-cols-10'
                        direction='left'
                        max={80}
                      />
                    ) : (
                      <span className='text-sm text-muted-foreground'>No numbers captured.</span>
                    )}
                  </div>

                  {/*{totalStored > displayNumbers.length && (
                            <p className='mt-1 text-[10px] text-muted-foreground'>
                              Showing last {displayNumbers.length} of {totalStored} stored spins
                            </p>
                          )}*/}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
const NumberItem = ({ n }: { n: number }) => {
  return (
    <p className='border border-border/60 border-r-0 last:border-r bg-background size-8 flex items-center justify-center font-mono text-sm text-foreground'>
      {n}
    </p>
  )
}
