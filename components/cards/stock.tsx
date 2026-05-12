'use client'

import { Icon } from '@/lib/icons'
import { LogoNameType } from '@/lib/icons/logos'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { EvilAreaChart } from '../evilcharts/charts/area-chart'
import { ChartConfig } from '../evilcharts/ui/chart'

export interface StockCardData {
  symbol: string
  name: string
  mcap?: string
  price: number | null
  change: number | null
  sparkline: { price: number }[]
}

interface StockProps {
  stock: StockCardData
  activeStock?: {
    symbol: string
  }
  setActiveSymbol?: (symbol: string) => void
  isPositive: boolean
}

const POSITIVE_CHART_COLOR = 'var(--foreground)'
const NEGATIVE_CHART_COLOR = 'var(--muted-foreground)'

const getPriceChartConfig = (label: string, positive: boolean) =>
  ({
    price: {
      label,
      colors: {
        light: [positive ? POSITIVE_CHART_COLOR : NEGATIVE_CHART_COLOR],
        dark: [positive ? POSITIVE_CHART_COLOR : NEGATIVE_CHART_COLOR]
      }
    }
  }) satisfies ChartConfig

const POSITIVE_SPARKLINE_CONFIG = getPriceChartConfig('Price', true)
const NEGATIVE_SPARKLINE_CONFIG = getPriceChartConfig('Price', false)
const formatPrice = (value: number | null) => (value === null ? 'N/A' : `$${value.toFixed(2)}`)
const formatChange = (value: number | null) => (value === null ? 'N/A' : `${Math.abs(value).toFixed(1)}%`)

export const Stock = ({ stock, activeStock, setActiveSymbol, isPositive }: StockProps) => {
  return (
    <div
      key={stock.symbol}
      // initial={{ opacity: 0, y: 15 }}
      // animate={{ opacity: 1, y: 0 }}
    >
      <Link
        href={`/company/${stock.symbol}`}
        onMouseEnter={() => setActiveSymbol?.(stock.symbol)}
        onFocus={() => setActiveSymbol?.(stock.symbol)}
        className={`glass-panel-hover rounded-sm p-4 flex items-center gap-4 group hover:bg-foreground/5 transition-colors ${
          activeStock?.symbol === stock.symbol ? 'ring-1 ring-foreground/25 bg-foreground/1.5' : ''
        }`}>
        <div className='w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors'>
          <Icon name={stock.symbol.toLowerCase() as LogoNameType} className='size-7 text-foreground/70' />
        </div>

        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-2'>
            <p className='font-display font-semibold text-foreground/70 text-base group-hover:text-primary transition-colors'>
              {stock.symbol}
            </p>
            {stock.mcap && (
              <span className='text-[10px] px-1 py-[0.5px] rounded bg-muted font-display text-foreground/70'>
                {stock.mcap}
              </span>
            )}
          </div>
          <p className='text-[10px] text-foreground/60 truncate'>{stock.name}</p>
        </div>

        <div className='w-18 h-10 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity'>
          <EvilAreaChart
            data={stock.sparkline}
            chartConfig={isPositive ? POSITIVE_SPARKLINE_CONFIG : NEGATIVE_SPARKLINE_CONFIG}
            className='h-full w-full min-h-0 aspect-auto!'
            chartProps={{
              margin: {
                top: 2,
                right: 2,
                bottom: 2,
                left: 2
              }
            }}
            curveType='bump'
            strokeVariant='solid'
            areaVariant='gradient'
            hideTooltip
            hideLegend
            hideCartesianGrid
            hideCursorLine
          />
        </div>

        <div className='text-right shrink-0'>
          <p className='font-display font-semibold text-foreground/80 text-base'>{formatPrice(stock.price)}</p>
          <div
            className={`flex items-center justify-end gap-0.5 text-xs font-mono ${isPositive ? 'text-foreground' : 'text-slate-500'}`}>
            <Icon
              name={isPositive ? 'trending-up' : 'trending-down'}
              className={cn('size-3.5 text-slate-500', { 'text-foreground': isPositive })}
            />
            <span className='font-display'>{formatChange(stock.change)}</span>
          </div>
        </div>
      </Link>
    </div>
  )
}
