import { clampPercent, formatPercentValue } from '@/lib/helpers/formatters'
import { TONE_CLASSES } from '@/lib/roulette/constants'
import { StatTile } from '@/lib/roulette/types'

export const StatCard = ({ label, value, detail, tone }: StatTile) => (
  <div className={`min-w-0 rounded-md border p-3 ${TONE_CLASSES[tone]}`}>
    <div className='flex items-start justify-between gap-3'>
      <p className='font-display text-[8px] uppercase tracking-[0.18em] text-foreground/55'>{label}</p>
      <span className='mt-0.5 size-1.5 shrink-0 rounded-full bg-current' />
    </div>
    <p className='mt-3 truncate font-display text-xl font-semibold text-foreground'>{value}</p>
    <p className='mt-1 truncate text-xs text-foreground/55'>{detail}</p>
  </div>
)

export const CoverageMeter = ({ value }: { value: number | undefined }) => {
  const width = clampPercent(value)

  return (
    <div className='space-y-2'>
      <div className='flex items-center justify-between gap-3 text-xs text-foreground/55'>
        <span>Coverage</span>
        <span className='font-mono text-foreground'>{formatPercentValue(value)}</span>
      </div>
      <div className='h-2 overflow-hidden rounded-full bg-muted'>
        <div className='h-full rounded-full bg-foreground transition-[width]' style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}

export const NumberLegend = () => (
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

export const getNumberCellClass = ({
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
