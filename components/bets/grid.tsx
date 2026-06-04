'use client'

import { CoverageMeter, getNumberCellClass, StatCard } from '@/components/bets/components'
import {
  formatInteger,
  formatNumber,
  formatNumberList,
  formatSignedNumber,
  formatStatus,
  getProfitTone
} from '@/components/bets/helpers'
import { K_QUADS, QId, ROULETTE_BOARD_ROWS } from '@/lib/roulette/constants'
import { BetResult } from '@/types/bets'

import { formatPercentValue } from '@/lib/helpers/formatters'
import { EvoTableGameState, StatTile, Tone } from '@/lib/roulette/types'
import { cn } from '@/lib/utils'

const tsmap: Record<EvoTableGameState, string> = {
  BETS_CLOSED: 'Bets Closed',
  BETS_CLOSING_SOON: 'Closing',
  BETS_CLOSED_ANNOUNCED: 'No More Bets',
  GAME_RESOLVED: 'Game Resolved',
  BETS_OPEN: 'Bets Open'
}

export const RouletteNumberGrid = ({ result }: { result: BetResult }) => {
  const hotNumbers = new Set(result.virtualBoard?.hotNumbers ?? [])
  const placedNumbers = new Set([...(result.placed?.cumulativeNumbers ?? []), ...(result.placed?.numbers ?? [])])
  const winningNumber = result.spin?.winningNumber ?? result.virtualBoard?.winningNumber
  const key = result.controls.signalFound && Object.keys(K_QUADS).find((q) => K_QUADS[q as QId].includes(winningNumber))
  const firstQuad = result.result.round === 0 && result.controls.signalFound ? K_QUADS[key as QId] : undefined
  const nextNumbers = new Set(
    result.controls.signalFound ? firstQuad : (result.virtualBoard?.nextBet?.numbers ?? result.bet?.numbers ?? [])
  )

  return (
    <section className='rounded-md border border-border bg-background p-3'>
      <div className='flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between'>
        <div className='w-full'>
          <div className='flex items-center justify-between w-full'>
            <p className='font-display text-[8px] uppercase tracking-[0.2em] text-foreground/50'>
              {tsmap[result.virtualBoard.tableState]}
            </p>
            <div
              className={cn('flex items-center space-x-2 font-display text-[8px] uppercase opacity-70', {
                'text-emerald-500': key
              })}>
              <div>
                <span className='tracking-[0.15em] opacity-70'>
                  {result.controls.signalFound ? `Found in ${key}` : 'Searching'}
                </span>
              </div>
            </div>
          </div>
        </div>
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

export const BetsGrid = ({ result }: { result: BetResult | null }) => {
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
      label: 'Profit',
      value: formatSignedNumber(profit),
      detail: `${formatPercentValue(outcome?.profitPct)}`,
      tone: getProfitTone(profit)
    },
    {
      label: 'Round',
      value: spin?.hit ? 'Hit' : controls.isTracking ? 'Miss' : 'Pass',
      detail: formatStatus(controls.isTracking ? spin?.hitType : spin?.sessionOutcome),
      tone: hitTone
    },
    {
      label: 'Stake',
      value: formatNumber(outcome?.stake ?? nextBet?.totalStake),
      detail: `${formatNumber(outcome?.sessionStake ?? board?.totalStaked)} sessions`,
      tone: 'neutral'
    },
    {
      label: 'Win',
      value: formatNumber(outcome?.winAmount ?? board?.winAmount),
      detail: '',
      tone: getProfitTone((outcome?.winAmount ?? 0) - (outcome?.stake ?? 0))
    },
    {
      label: 'Coverage',
      value: `${formatInteger(nextBet?.coverageCount)}`,
      detail: `${formatPercentValue(nextBet?.coveragePercent)}`,
      tone: coverageTone
    },
    {
      label: 'Tracking',
      value: controls?.isTracking ? 'Live' : 'No',
      detail: formatStatus(controls?.betStatus),
      tone: trackingTone
    }
  ]

  return (
    <div className='space-y-3'>
      <div className='grid gap-3 grid-cols-3 md:grid-cols-4 2xl:grid-cols-6'>
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className='grid items-start gap-3'>
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
