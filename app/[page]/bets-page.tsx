'use client'

import { JsonViewer } from '@/components/data/json-viewer'
import { SimpleTable } from '@/components/data/simple-table'
import { Tab, Tabs } from '@/components/ui/tabs'
import { useApi } from '@/hooks/use-api'
import { useToggle } from '@/hooks/use-toggle'
import { Icon } from '@/lib/icons'
import type { BetResult } from '@/types/bets'
import { useMemo } from 'react'

interface BetsResponse {
  success: boolean
  hasData?: boolean
  message?: string
  receivedAt?: string
  data?: BetResult | string
}

const TABLE_NODE_KEYS = ['controls', 'virtualBoard', 'spin', 'result', 'bet', 'placed'] as const

interface TableNode {
  title: string
  data: Record<string, unknown>
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const parseBetResult = (value: unknown): BetResult | null => {
  if (typeof value === 'string') {
    try {
      return parseBetResult(JSON.parse(value) as unknown)
    } catch {
      return null
    }
  }

  if (!isRecord(value) || !isRecord(value.controls)) {
    return null
  }

  return value as unknown as BetResult
}

const getTableNodes = (value: unknown): TableNode[] => {
  const result = parseBetResult(value)

  if (!result) {
    return []
  }

  const nodes: TableNode[] = [
    {
      title: 'meta',
      data: {
        type: result.type,
        schemaVersion: result.schemaVersion,
        emittedAt: result.emittedAt
      }
    }
  ]

  for (const key of TABLE_NODE_KEYS) {
    const data = result[key]

    if (isRecord(data)) {
      nodes.push({ title: key, data })
    }
  }

  return nodes
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
  const tableNodes = useMemo(() => getTableNodes(payload), [payload])

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
      }
    ],
    [payload, showToolbar, toggleToolbar, isLoading, error, tableNodes]
  )

  return (
    <main className='space-y-3 p-0'>
      <Tabs tabs={tabs} />
    </main>
  )
}
