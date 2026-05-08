import { Stock } from '@/components/cards/stock'
import { EvilAreaChart } from '@/components/evilcharts/charts/area-chart'
import type { ChartConfig } from '@/components/evilcharts/ui/chart'
import Link from 'next/link'
import { useState } from 'react'

const HISTORY_LABELS = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May']
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

const BASE_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc', price: 227.8, change: 1.5, sector: 'Technology', mcap: '$3.5T' },
  { symbol: 'MSFT', name: 'Microsoft Corp', price: 428.5, change: 0.9, sector: 'Technology', mcap: '$3.2T' },
  { symbol: 'NVDA', name: 'NVIDIA Corp', price: 892.5, change: 4.2, sector: 'Technology', mcap: '$2.2T' },
  { symbol: 'GOOGL', name: 'Alphabet Inc', price: 176.3, change: -0.4, sector: 'Technology', mcap: '$2.1T' },
  { symbol: 'AMZN', name: 'Amazon.com Inc', price: 186.4, change: -1.1, sector: 'Consumer', mcap: '$1.9T' },
  { symbol: 'META', name: 'Meta Platforms', price: 512.3, change: 3.1, sector: 'Technology', mcap: '$1.3T' },
  { symbol: 'TSLA', name: 'Tesla Inc', price: 178.6, change: -2.8, sector: 'Consumer', mcap: '$568B' },
  { symbol: 'JPM', name: 'JPMorgan Chase', price: 198.2, change: 0.6, sector: 'Financials', mcap: '$572B' },
  { symbol: 'V', name: 'Visa Inc', price: 281.4, change: 0.3, sector: 'Financials', mcap: '$578B' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', price: 156.7, change: -0.2, sector: 'Healthcare', mcap: '$376B' },
  { symbol: 'UNH', name: 'UnitedHealth Group', price: 527.1, change: 1.1, sector: 'Healthcare', mcap: '$487B' },
  { symbol: 'XOM', name: 'Exxon Mobil', price: 114.8, change: 1.8, sector: 'Energy', mcap: '$458B' }
]

const createSeededRandom = (seed: number) => {
  let value = seed

  return () => {
    value += 0x6d2b79f5
    let t = value
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const hashString = (value: string) =>
  Array.from(value).reduce((hash, char) => Math.imul(hash ^ char.charCodeAt(0), 16777619), 2166136261)

const genSparkline = (symbol: string, positive: boolean) => {
  const random = createSeededRandom(hashString(symbol))
  let v = 42 + random() * 16

  return Array.from({ length: 15 }, () => {
    const drift = positive ? 0.55 : -0.55
    v = Math.max(8, Math.min(92, v + drift + (random() - 0.5) * 7))
    return { price: Number(v.toFixed(2)) }
  })
}

const genPriceHistory = (symbol: string, currentPrice: number, positive: boolean) => {
  const random = createSeededRandom(hashString(`${symbol}-history`))
  let rawPrice = 88 + random() * 18

  const history = HISTORY_LABELS.map((month, index) => {
    const drift = positive ? 1.2 : -1.2
    const seasonal = Math.sin(index / 1.8 + random() * 1.5) * 2.4
    rawPrice = Math.max(24, rawPrice + drift + seasonal + (random() - 0.5) * 6)

    return {
      month,
      rawPrice
    }
  })

  const scale = currentPrice / history[history.length - 1].rawPrice

  return history.map(({ month, rawPrice }) => ({
    month,
    price: Number((rawPrice * scale).toFixed(2))
  }))
}

const STOCKS = BASE_STOCKS.map((stock) => ({
  ...stock,
  sparkline: genSparkline(stock.symbol, stock.change >= 0),
  history: genPriceHistory(stock.symbol, stock.price, stock.change >= 0)
}))

export const Explore = () => {
  const [query] = useState('')
  const [sectorFilter, setSectorFilter] = useState('All')
  const [activeSymbol, setActiveSymbol] = useState(STOCKS[0]?.symbol ?? '')

  const sectors = ['All', ...new Set(STOCKS.map((s) => s.sector))]

  const filtered = STOCKS.filter((s) => {
    const matchQuery =
      !query ||
      s.symbol.toLowerCase().includes(query.toLowerCase()) ||
      s.name.toLowerCase().includes(query.toLowerCase())
    const matchSector = sectorFilter === 'All' || s.sector === sectorFilter
    return matchQuery && matchSector
  })

  const activeStock = filtered.find((stock) => stock.symbol === activeSymbol) ?? filtered[0] ?? null

  return (
    <div className='space-y-6 max-w-7xl'>
      {/* Search + Filters */}
      <div
        // initial={{ opacity: 0, y: 10 }}
        // animate={{ opacity: 1, y: 0 }}
        // transition={{ delay: 0.1 }}
        className='flex flex-col sm:flex-row gap-3'>
        <div className='flex gap-1.5 flex-wrap'>
          {sectors.map((s) => (
            <button
              key={s}
              onClick={() => setSectorFilter(s)}
              className={`px-4 h-6 rounded-sm text-sm font-display transition-all
                ${
                  sectorFilter === s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {activeStock ? (
        <div className='grid grid-cols-1 xl:grid-cols-[minmax(0,1.8fr)_20rem] gap-3'>
          <div className='rounded-md bg-border/5 p-2 sm:p-2'>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
              <div className='space-y-1'>
                <p className='text-[8px] font-mono uppercase tracking-[0.24em] text-slate-500'>Focused ticker</p>
                <div className='flex items-end gap-5'>
                  <h2 className='font-display text-3xl font-semibold tracking-tight text-foreground'>
                    {activeStock.symbol}
                  </h2>
                  <span className='pb-1 text-sm text-foreground/70'>{activeStock.name}</span>
                </div>
              </div>

              <div className='text-left sm:text-right'>
                <p className='text-2xl font-mono font-semibold text-foreground ticker-font'>
                  ${activeStock.price.toFixed(2)}
                </p>
                <p className={`text-sm font-mono ${activeStock.change >= 0 ? 'text-foreground' : 'text-slate-500'}`}>
                  {activeStock.change >= 0 ? '+' : ''}
                  {activeStock.change.toFixed(1)}% today
                </p>
              </div>
            </div>

            <div className='mt-4 h-72'>
              <EvilAreaChart
                data={activeStock.history}
                chartConfig={getPriceChartConfig(`${activeStock.symbol} price`, activeStock.change >= 0)}
                xDataKey='month'
                yDataKey='price'
                className='h-full w-full min-h-0'
                chartProps={{
                  margin: {
                    top: 10,
                    right: 10,
                    bottom: 0,
                    left: 6
                  }
                }}
                curveType='monotone'
                strokeVariant='solid'
                areaVariant='gradient'
                showBrush
                brushHeight={44}
                brushFormatLabel={(value) => String(value)}
                tooltipVariant='frosted-glass'
                tooltipRoundness='xl'
                xAxisProps={{
                  tickMargin: 10
                }}
                yAxisProps={{
                  tickFormatter: (value) => `$${Number(value).toFixed(0)}`
                }}
              />
            </div>
          </div>

          <div className='rounded-md bg-border/5 p-4 sm:p-5'>
            <div className='grid grid-cols-2 gap-3'>
              <div className='rounded-xl bg-background/80 p-3'>
                <p className='text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground'>Sector</p>
                <p className='mt-2 text-sm font-medium text-foreground'>{activeStock.sector}</p>
              </div>
              <div className='rounded-xl bg-background/80 p-3'>
                <p className='text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground'>Market Cap</p>
                <p className='mt-2 text-sm font-medium text-foreground'>{activeStock.mcap}</p>
              </div>
              <div className='rounded-xl bg-background/80 p-3'>
                <p className='text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground'>Trend</p>
                <p className='mt-2 text-sm font-medium text-foreground'>
                  {activeStock.change >= 0 ? 'Accumulating higher lows' : 'Trading below recent highs'}
                </p>
              </div>
              <div className='rounded-xl bg-background/80 p-3'>
                <p className='text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground'>Profile</p>
                <Link
                  href={`/company/${activeStock.symbol}`}
                  className='mt-2 inline-flex text-sm font-medium text-primary transition-colors hover:text-foreground'>
                  Open company
                </Link>
              </div>
            </div>

            <div className='mt-4 space-y-2'>
              <p className='text-[10px] font-mono uppercase tracking-[0.24em] text-muted-foreground'>Quick picks</p>
              <div className='flex flex-wrap gap-2'>
                {filtered.slice(0, 8).map((stock) => (
                  <button
                    key={stock.symbol}
                    type='button'
                    aria-pressed={activeStock.symbol === stock.symbol}
                    onClick={() => setActiveSymbol(stock.symbol)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-mono transition-colors ${
                      activeStock.symbol === stock.symbol
                        ? 'border-primary/30 bg-primary/10 text-primary'
                        : 'border-border/50 bg-background/80 text-muted-foreground hover:text-foreground'
                    }`}>
                    {stock.symbol}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className='rounded-2xl border border-dashed border-border/60 bg-muted/20 px-4 py-10 text-center'>
          <p className='font-medium text-foreground'>No stocks match the current filters.</p>
          <p className='mt-1 text-sm text-muted-foreground'>Try a broader search or switch sectors.</p>
        </div>
      )}

      {/* Stock Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3'>
        {filtered.map((stock) => {
          const isPositive = stock.change >= 0
          return (
            <Stock
              key={stock.symbol}
              stock={stock}
              activeStock={activeStock}
              setActiveSymbol={setActiveSymbol}
              isPositive={isPositive}
            />
          )
        })}
      </div>
    </div>
  )
}
