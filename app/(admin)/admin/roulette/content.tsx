'use client'

import { x1 } from '@/components/bets/result'
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

type Tone = 'good' | 'bad' | 'warn' | 'info' | 'neutral'

interface StatTile {
  label: string
  value: string
  detail: string
  tone: Tone
}

const ROULETTE_BOARD_ROWS = [
  [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
  [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
  [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34]
]

const toneClasses: Record<Tone, string> = {
  good: 'border-emerald-500/35 bg-emerald-500/5 text-emerald-700 dark:text-emerald-200',
  bad: 'border-rose-500/35 bg-rose-500/5 text-rose-700 dark:text-rose-200',
  warn: 'border-amber-500/35 bg-amber-500/5 text-amber-700 dark:text-amber-200',
  info: 'border-sky-500/35 bg-sky-500/5 text-sky-700 dark:text-sky-200',
  neutral: 'border-border bg-background text-foreground'
}

const numberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 2
})

const integerFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0
})

const formatNumber = (value: number | undefined) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'N/A'
  }

  return numberFormatter.format(value)
}

const formatInteger = (value: number | undefined) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'N/A'
  }

  return integerFormatter.format(value)
}

const formatSignedNumber = (value: number | undefined) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'N/A'
  }

  const prefix = value > 0 ? '+' : ''

  return `${prefix}${numberFormatter.format(value)}`
}

const formatPercent = (value: number | undefined) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'N/A'
  }

  return `${numberFormatter.format(value)}%`
}

const formatStatus = (value: string | undefined) => {
  if (!value) {
    return 'N/A'
  }

  return value.replaceAll('_', ' ').replaceAll('-', ' ')
}

const formatNumberList = (numbers: number[] | undefined, limit = 8) => {
  if (!numbers?.length) {
    return 'None'
  }

  const visible = numbers.slice(0, limit).join(', ')
  const remaining = numbers.length - limit

  return remaining > 0 ? `${visible} +${remaining}` : visible
}

const getProfitTone = (value: number | undefined): Tone => {
  if (typeof value !== 'number') {
    return 'neutral'
  }

  if (value > 0) {
    return 'good'
  }

  if (value < 0) {
    return 'bad'
  }

  return 'neutral'
}

const clampPercent = (value: number | undefined) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0
  }

  return Math.max(0, Math.min(100, value))
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

const StatCard = ({ label, value, detail, tone }: StatTile) => (
  <div className={`min-w-0 rounded-md border p-3 ${toneClasses[tone]}`}>
    <div className='flex items-start justify-between gap-3'>
      <p className='font-display text-[8px] uppercase tracking-[0.18em] text-foreground/55'>{label}</p>
      <span className='mt-0.5 size-1.5 shrink-0 rounded-full bg-current' />
    </div>
    <p className='mt-3 truncate font-display text-xl font-semibold text-foreground'>{value}</p>
    <p className='mt-1 truncate text-xs text-foreground/55'>{detail}</p>
  </div>
)

const CoverageMeter = ({ value }: { value: number | undefined }) => {
  const width = clampPercent(value)

  return (
    <div className='space-y-2'>
      <div className='flex items-center justify-between gap-3 text-xs text-foreground/55'>
        <span>Coverage</span>
        <span className='font-mono text-foreground'>{formatPercent(value)}</span>
      </div>
      <div className='h-2 overflow-hidden rounded-full bg-muted'>
        <div className='h-full rounded-full bg-foreground transition-[width]' style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}

const NumberLegend = () => (
  <div className='flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-foreground/50'>
    <span className='inline-flex items-center gap-1'>
      <span className='size-2 rounded-full bg-foreground' />
      winner
    </span>
    <span className='inline-flex items-center gap-1'>
      <span className='size-2 rounded-full bg-emerald-500' />
      placed
    </span>
    <span className='inline-flex items-center gap-1'>
      <span className='size-2 rounded-full bg-sky-500' />
      next
    </span>
    <span className='inline-flex items-center gap-1'>
      <span className='size-2 rounded-full bg-amber-500' />
      hot
    </span>
  </div>
)

const getNumberCellClass = ({
  number,
  winningNumber,
  placedNumbers,
  nextNumbers,
  hotNumbers,
  isTall = false
}: {
  number: number
  winningNumber: number | undefined
  placedNumbers: Set<number>
  nextNumbers: Set<number>
  hotNumbers: Set<number>
  isTall?: boolean
}) => {
  const base = `flex min-w-0 items-center justify-center rounded-sm border font-display text-xs font-medium transition-colors ${
    isTall ? 'h-full min-h-0' : 'aspect-square'
  }`

  if (number === winningNumber) {
    return `${base} border-foreground bg-foreground text-background`
  }

  if (placedNumbers.has(number)) {
    return `${base} border-emerald-500/50 bg-emerald-500/15 text-emerald-700 dark:text-emerald-200`
  }

  if (nextNumbers.has(number)) {
    return `${base} border-sky-500/50 bg-sky-500/15 text-sky-700 dark:text-sky-200`
  }

  if (hotNumbers.has(number)) {
    return `${base} border-amber-500/50 bg-amber-500/15 text-amber-700 dark:text-amber-200`
  }

  return `${base} border-border bg-muted/20 text-foreground/45`
}

const RouletteNumberGrid = ({ result }: { result: BetResult }) => {
  const hotNumbers = new Set(result.virtualBoard?.hotNumbers ?? [])
  const placedNumbers = new Set([...(result.placed?.cumulativeNumbers ?? []), ...(result.placed?.numbers ?? [])])
  const nextNumbers = new Set(result.virtualBoard?.nextBet?.numbers ?? result.bet?.numbers ?? [])
  const winningNumber = result.spin?.winningNumber ?? result.virtualBoard?.winningNumber

  return (
    <section className='rounded-md border border-border bg-background p-3'>
      <div className='flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <p className='font-display text-[8px] uppercase tracking-[0.2em] text-foreground/50'>Number field</p>
          <h2 className='mt-1 font-display text-lg font-semibold text-foreground'>Wheel coverage</h2>
        </div>
        <NumberLegend />
      </div>
      <div className='mt-3 grid grid-cols-[repeat(13,minmax(2.35rem,1fr))] gap-1 overflow-x-auto pb-1'>
        <div
          className={`${getNumberCellClass({
            number: 0,
            winningNumber,
            placedNumbers,
            nextNumbers,
            hotNumbers,
            isTall: true
          })} col-span-1 row-span-3`}>
          0
        </div>
        {ROULETTE_BOARD_ROWS.flat().map((number) => (
          <div
            key={number}
            className={getNumberCellClass({
              number,
              winningNumber,
              placedNumbers,
              nextNumbers,
              hotNumbers
            })}>
            {number}
          </div>
        ))}
      </div>
    </section>
  )
}

const ExposureGrid = ({ result }: { result: BetResult }) => {
  const slots = [...(result.bet?.slots ?? result.virtualBoard?.nextBet?.slots ?? [])]
    .sort((left, right) => right.bet - left.bet)
    .slice(0, 6)

  return (
    <section className='rounded-md border border-border bg-muted/15 p-3'>
      <div className='flex items-end justify-between gap-3'>
        <div>
          <p className='font-display text-[8px] uppercase tracking-[0.2em] text-foreground/50'>Exposure</p>
          <h2 className='mt-1 font-display text-base font-semibold text-foreground'>Largest slots</h2>
        </div>
        <p className='text-xs text-foreground/50'>{slots.length ? `${slots.length} shown` : 'No slots'}</p>
      </div>
      <div className='mt-3 grid grid-cols-2 md:grid-cols-3 gap-2'>
        {slots.map((slot) => (
          <div
            key={`${slot.number}-${slot.bet}-${slot.placements}`}
            className='rounded-md border border-border bg-background p-2'>
            <div className='flex items-center justify-between gap-2'>
              <span className='font-display text-lg font-semibold text-foreground'>{slot.number}</span>
              <span className='rounded-sm bg-muted px-1.5 py-0.5 text-[10px] text-foreground/60'>
                {slot.isZeroHedge ? 'hedge' : `${slot.placements}x`}
              </span>
            </div>
            <p className='mt-1 font-mono text-xs text-foreground/70'>{formatNumber(slot.bet)}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

const BetsGrid = ({ result }: { result: BetResult | null }) => {
  if (!result) {
    return <div className='text-sm text-foreground/50'>No bet result data available.</div>
  }

  const controls = result.controls
  const board = result.virtualBoard
  const spin = result.spin
  const outcome = result.result
  const nextBet = board?.nextBet ?? result.bet
  const profit = outcome?.profit ?? board?.profit
  const hitTone: Tone = spin?.hit ? 'good' : spin?.sessionOutcome === 'loss' ? 'bad' : 'neutral'
  const trackingTone: Tone = controls?.isTracking ? 'good' : controls?.loaded ? 'info' : 'neutral'
  const coverageTone: Tone = (nextBet?.coveragePercent ?? 0) >= 45 ? 'warn' : 'info'

  const stats: StatTile[] = [
    {
      label: 'Session profit',
      value: formatSignedNumber(profit),
      detail: `${formatPercent(outcome?.profitPct)} return`,
      tone: getProfitTone(profit)
    },
    {
      label: 'Round result',
      value: spin?.hit ? 'Hit' : 'Miss',
      detail: formatStatus(spin?.hitType ?? spin?.sessionOutcome),
      tone: hitTone
    },
    {
      label: 'Stake',
      value: formatNumber(outcome?.stake ?? nextBet?.totalStake),
      detail: `${formatNumber(outcome?.sessionStake ?? board?.totalStaked)} session`,
      tone: 'neutral'
    },
    {
      label: 'Win amount',
      value: formatNumber(outcome?.winAmount ?? board?.winAmount),
      detail: controls?.winVerb ? formatStatus(controls.winVerb) : 'Current spin',
      tone: getProfitTone((outcome?.winAmount ?? 0) - (outcome?.stake ?? 0))
    },
    {
      label: 'Coverage',
      value: `${formatInteger(nextBet?.coverageCount)} nums`,
      detail: `${formatPercent(nextBet?.coveragePercent)} of board`,
      tone: coverageTone
    },
    {
      label: 'Tracking',
      value: controls?.isTracking ? 'Live' : 'Idle',
      detail: formatStatus(controls?.betStatus),
      tone: trackingTone
    }
  ]

  return (
    <div className='space-y-3'>
      <div className='grid gap-3 grid-cols-2 md:grid-cols-3 2xl:grid-cols-6'>
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className='grid items-start gap-3'>
        <RouletteNumberGrid result={result} />

        <div className='space-y-3'>
          <section className='rounded-md border border-border bg-background p-3'>
            <p className='font-display text-[8px] uppercase tracking-[0.2em] text-foreground/50'>Next construction</p>
            <div className='mt-3 grid grid-cols-2 gap-3'>
              <div>
                <p className='text-xs text-foreground/50'>Round</p>
                <p className='mt-1 font-display text-2xl font-semibold text-foreground'>
                  {formatInteger(nextBet?.round)}
                </p>
              </div>
              <div>
                <p className='text-xs text-foreground/50'>Unit stake</p>
                <p className='mt-1 font-display text-2xl font-semibold text-foreground'>
                  {formatNumber(nextBet?.unitStake)}
                </p>
              </div>
            </div>
            <div className='mt-4'>
              <CoverageMeter value={nextBet?.coveragePercent} />
            </div>
            <div className='mt-4 grid grid-cols-2 gap-2 text-xs'>
              <div className='rounded-md bg-muted/30 p-2'>
                <p className='text-foreground/50'>Quadrants</p>
                <p className='mt-1 truncate font-display text-foreground'>
                  {(nextBet?.quadrants ?? [nextBet?.quadrant]).filter(Boolean).join(' / ') || 'N/A'}
                </p>
              </div>
              <div className='rounded-md bg-muted/30 p-2'>
                <p className='text-foreground/50'>Mode</p>
                <p className='mt-1 truncate font-display text-foreground'>
                  {formatStatus(nextBet?.spreadSelectionMode)}
                </p>
              </div>
              <div className='rounded-md bg-muted/30 p-2'>
                <p className='text-foreground/50'>Hot</p>
                <p className='mt-1 truncate font-mono text-foreground'>{formatNumberList(board?.hotNumbers, 5)}</p>
              </div>
              <div className='rounded-md bg-muted/30 p-2'>
                <p className='text-foreground/50'>Placed</p>
                <p className='mt-1 truncate font-mono text-foreground'>{formatNumberList(result.placed?.numbers, 5)}</p>
              </div>
            </div>
          </section>

          <ExposureGrid result={result} />
        </div>
      </div>
    </div>
  )
}

export const Content = () => {
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
        label: 'grid',
        value: 'grid',
        content: isLoading ? (
          <Icon name='spinner-ring' />
        ) : error ? (
          <div className='text-sm text-red-500'>{error}</div>
        ) : (
          <BetsGrid result={betResult} />
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
