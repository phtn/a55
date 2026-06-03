'use client'

import { Board } from '@/components/bets/board'
import { BetsGrid } from '@/components/bets/grid'
import { getTableNodes, parseBetResult } from '@/components/bets/helpers'
import { x1 } from '@/components/bets/result'
import { JsonViewer } from '@/components/data/json-viewer'
import { SimpleTable } from '@/components/data/simple-table'
import { Tab, Tabs } from '@/components/ui/tabs'
import { useApi } from '@/hooks/use-api'
import { useToggle } from '@/hooks/use-toggle'
import { Icon } from '@/lib/icons'
import { BetsResponse } from '@/lib/roulette/types'
import { useMemo } from 'react'

export const BetsPage = () => {
  const { on: showToolbar, toggle: toggleToolbar } = useToggle()
  const {
    data: bets,
    error,
    isLoading
  } = useApi<BetsResponse>('/api/bets/r1', {
    refreshInterval: 2000
  })

  const payload = bets?.data ?? x1
  const tableNodes = useMemo(() => getTableNodes(payload), [payload])
  const betResult = useMemo(() => parseBetResult(payload), [payload])

  const tabs: Tab[] = useMemo(
    () => [
      {
        label: 'json',
        value: 'json',
        content: isLoading ? (
          <Icon name='spinner-ring' />
        ) : error ? (
          <div className='text-sm text-red-500'>{error}</div>
        ) : (
          <JsonViewer data={payload} maxHeight='max-h-300' withToolbar={showToolbar}>
            <button onClick={toggleToolbar} className='text-sm mr-4'>
              tools
            </button>
          </JsonViewer>
        )
      },
      {
        label: 'table',
        value: 'table',
        content: isLoading ? (
          <Icon name='spinner-ring' />
        ) : error ? (
          <div className='text-sm text-red-500'>{error}</div>
        ) : tableNodes.length > 0 ? (
          <div className='grid items-start gap-3 md:grid-cols-3 xl:grid-cols-6'>
            {tableNodes.slice(1).map((node) => (
              <SimpleTable key={node.title} title={node.title} data={node.data} />
            ))}
          </div>
        ) : (
          <div className='text-sm text-foreground/50'>No bet result data available.</div>
        )
      },
      {
        label: 'stats',
        value: 'stats',
        content: isLoading ? (
          <Icon name='spinner-ring' />
        ) : error ? (
          <div className='text-sm text-red-500'>{error}</div>
        ) : (
          <BetsGrid result={betResult} />
        )
      },
      {
        label: 'board',
        value: 'board',
        content: isLoading ? (
          <Icon name='spinner-ring' />
        ) : error ? (
          <div className='text-sm text-red-500'>{error}</div>
        ) : (
          <Board result={betResult} />
        )
      }
    ],
    [payload, showToolbar, toggleToolbar, isLoading, error, tableNodes, betResult]
  )

  return (
    <main className='space-y-3 p-0'>
      <Tabs tabs={tabs} />
    </main>
  )
}
