'use client'

import { useApi } from '@/hooks/use-api'
import { LobbyHistoriesResponse } from '@/lib/roulette/types'
import { TableHistories } from './table-histories'

export const Content = () => {
  const {
    data: response,
    error,
    isLoading
  } = useApi<LobbyHistoriesResponse>('/api/bets/r2', {
    refreshInterval: 2000
  })

  const payload = response?.data ?? null

  return (
    <section className='w-[calc(84vw)] space-y-4 md:space-y-4'>
      {error ? <div className='bg-destructive/5 p-4 text-sm text-destructive'>{error}</div> : null}

      {payload ? (
        <TableHistories payload={payload} />
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
