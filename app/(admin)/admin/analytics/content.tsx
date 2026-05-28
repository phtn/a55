'use client'

import { JsonViewer } from '@/components/data/json-viewer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useApi } from '@/hooks/use-api'
import { formatDateTime } from '@/lib/helpers/formatters'
import { LobbyHistoriesResponse } from '@/lib/roulette/types'
import { rtnMap } from './rtn-map'

const getTableName = (tableId: string) => rtnMap[tableId] ?? tableId

export const Content = () => {
  const {
    data: response,
    error,
    isLoading
  } = useApi<LobbyHistoriesResponse>('/api/bets/r2', {
    refreshInterval: 2000
  })

  const payload = response?.data ?? null
  const historyItems = payload?.histories ?? []

  return (
    <section className='w-7xl space-y-4 md:space-y-4'>
      <div className='w-full'>
        <div className='bg-background/70 flex items-center justify-between w-full'>
          <p className='font-display text-base font-medium tracking-tight'>Roulette Histories</p>
          <p>{formatDateTime(response?.receivedAt ?? null)}</p>
        </div>
      </div>

      {error ? <div className='bg-destructive/5 p-4 text-sm text-destructive'>{error}</div> : null}

      {payload ? (
        <div className=''>
          <Card className='bg-background/70 p-0 rounded-xs border-none!'>
            <CardHeader className='py-2'>
              <CardTitle className='font-poly font-semibold text-lg'>
                {historyItems.length > 0
                  ? `${historyItems.length} table${historyItems.length === 1 ? '' : 's'}`
                  : 'No table data'}
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-0 p-0 rounded-xs border-none!'>
              {historyItems.map((history) => (
                <div
                  key={`${history.tableId}-${payload.emittedAt}`}
                  className='rounded-xs border-t border-border/50 bg-muted/20 p-4'>
                  <div className='relative flex flex-wrap items-start justify-between'>
                    <div>
                      <p className='font-display font-medium text-base text-foreground'>
                        {getTableName(history.tableId.toLowerCase())}
                      </p>
                    </div>
                    <div className='absolute -top-2 -right-2'>
                      <p className='font-display text-xl text-foreground'>{history.numbers.length}</p>
                    </div>
                  </div>

                  <div className='mt-1 flex flex-wrap'>
                    {history.numbers.length > 0 ? (
                      history.numbers.map((number, index) => (
                        <span
                          key={`${history.tableId}-${number}-${index}`}
                          className='border border-border/60 border-r-0 last:border-r bg-background px-2 py-1 font-mono text-sm text-foreground'>
                          {number}
                        </span>
                      ))
                    ) : (
                      <span className='text-sm text-muted-foreground'>No numbers captured.</span>
                    )}
                  </div>

                  {/*<p className='mt-4 text-sm text-muted-foreground'>{formatNumbers(history.numbers)}</p>*/}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className='hidden border border-border/50 bg-background/70'>
            <CardHeader>
              <CardDescription>Payload details</CardDescription>
              <CardTitle className='font-display text-lg'>Raw snapshot</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-3 text-sm text-muted-foreground'>
                <div>
                  <p className='text-xs uppercase tracking-[0.18em]'>Source page</p>
                  <p className='mt-1 break-all text-foreground/80'>{payload.pageUrl}</p>
                </div>
                <div>
                  <p className='text-xs uppercase tracking-[0.18em]'>Capture URL</p>
                  <p className='mt-1 break-all text-foreground/80'>{payload.captureUrl}</p>
                </div>
              </div>

              <JsonViewer data={payload} maxHeight='max-h-[32rem]' withToolbar />
            </CardContent>
          </Card>
        </div>
      ) : isLoading ? (
        <div className='rounded-xl border border-border/50 bg-background/70 p-6 text-sm text-muted-foreground'>
          Waiting for the first LobbyHistories payload from /api/bets/r2.
        </div>
      ) : (
        <div className='rounded-xl border border-border/50 bg-background/70 p-6 text-sm text-muted-foreground'>
          No lobby history payload has been received yet.
        </div>
      )}
    </section>
  )
}
