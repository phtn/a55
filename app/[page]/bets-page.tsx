'use client'

import { JsonViewer } from '@/components/data/json-viewer'
import { useApi } from '@/hooks/use-api'
import { useToggle } from '@/hooks/use-toggle'

interface BetsResponse {
  success: boolean
  hasData?: boolean
  message?: string
  receivedAt?: string
  data?: unknown
}

export const BetsPage = () => {
  const { on: showToolbar, toggle: toggleToolbar } = useToggle()
  const {
    data: bets,
    error,
    isLoading
  } = useApi<BetsResponse>('/api/bets/r1', {
    refreshInterval: 2000
  })

  const payload = bets?.data ?? bets

  return (
    <main className='space-y-3 p-2'>
      {bets?.receivedAt ? (
        <div className='text-xs text-zinc-500'>Last received: {new Date(bets.receivedAt).toLocaleString()}</div>
      ) : null}
      {isLoading ? <div className='text-sm text-zinc-500'>Loading bets...</div> : null}
      {error ? <div className='text-sm text-red-500'>{error}</div> : null}
      {!isLoading && !error && !bets?.hasData ? (
        <div className='text-sm text-zinc-500'>No bets received yet.</div>
      ) : null}

      <JsonViewer data={payload} maxHeight='max-h-300' withToolbar={showToolbar}>
        <button onClick={toggleToolbar} className='text-sm mr-4'>
          tools
        </button>
      </JsonViewer>
    </main>
  )
}
