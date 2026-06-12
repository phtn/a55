'use client'

import { Stock } from '@/components/cards/stock'
import { EvilAreaChart } from '@/components/evilcharts/charts/area-chart'
import type { ChartConfig } from '@/components/evilcharts/ui/chart'
import { Eyebrow } from '@/components/ui/eyebrow'
import { type ExploreStock, getCachedExploreData, loadExploreData } from '@/lib/explore-data'
import gsap from 'gsap'
import Link from 'next/link'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

const POSITIVE_CHART_COLOR = 'var(--foreground)'
const NEGATIVE_CHART_COLOR = 'var(--muted-foreground)'
const STOCKS_PER_SECTOR = 12

type AsyncStatus = 'loading' | 'ready' | 'error'

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

const formatPrice = (value: number, currencyCode = 'USD') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode || 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)

const formatPriceValue = (value: number | null, currencyCode = 'USD') =>
  value === null ? 'N/A' : formatPrice(value, currencyCode)

const formatPercentValue = (value: number | null) =>
  value === null ? 'N/A' : `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`

const limitStocksPerSector = (stocks: ExploreStock[], sectorFilter: string) => {
  const grouped = stocks.reduce<Map<string, ExploreStock[]>>((map, stock) => {
    const sector = stock.sector || 'Other'
    const existing = map.get(sector)

    if (existing) {
      existing.push(stock)
    } else {
      map.set(sector, [stock])
    }

    return map
  }, new Map())

  if (sectorFilter !== 'All') {
    return (grouped.get(sectorFilter) ?? []).slice(0, STOCKS_PER_SECTOR)
  }

  return Array.from(grouped.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .flatMap(([, sectorStocks]) => sectorStocks.slice(0, STOCKS_PER_SECTOR))
}

export const ExploreContent = () => {
  const rootRef = useRef<HTMLDivElement>(null)
  const hasAnimatedRef = useRef(false)
  const [stocks, setStocks] = useState<ExploreStock[]>(() => getCachedExploreData() ?? [])
  const [status, setStatus] = useState<AsyncStatus>(() => (getCachedExploreData() ? 'ready' : 'loading'))
  const [error, setError] = useState<string | null>(null)
  const [activeSymbol, setActiveSymbol] = useState('')
  const [query] = useState(activeSymbol)
  const [sectorFilter, setSectorFilter] = useState('Technology')

  useEffect(() => {
    if (status === 'loading') {
      hasAnimatedRef.current = false
    }
  }, [status])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const cachedStocks = getCachedExploreData() ?? null

      setStocks(cachedStocks ?? [])
      setStatus(cachedStocks ? 'ready' : 'loading')
      setError(null)

      try {
        const nextStocks = await loadExploreData()

        if (cancelled) {
          return
        }

        setStocks(nextStocks)
        setActiveSymbol((current) =>
          nextStocks.some((stock) => stock.symbol === current) ? current : (nextStocks[0]?.symbol ?? '')
        )
        setStatus('ready')
      } catch (nextError) {
        if (cancelled) {
          return
        }

        setStocks([])
        setActiveSymbol('')
        setStatus('error')
        setError(nextError instanceof Error ? nextError.message : 'Unknown error')
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  const sectors = [...new Set(stocks.map((stock) => stock.sector).filter(Boolean)).values()]
  const queryFiltered = stocks.filter((stock) => {
    const normalizedQuery = query.trim().toLowerCase()
    const matchQuery =
      !normalizedQuery ||
      stock.symbol.toLowerCase().includes(normalizedQuery) ||
      stock.name.toLowerCase().includes(normalizedQuery)
    return matchQuery
  })
  const filtered = limitStocksPerSector(queryFiltered, sectorFilter)

  const activeStock = filtered.find((stock) => stock.symbol === activeSymbol) ?? filtered[0] ?? null

  useLayoutEffect(() => {
    if (!rootRef.current || status !== 'ready' || hasAnimatedRef.current) {
      return
    }

    if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    const ctx = gsap.context(() => {
      const filters = rootRef.current?.querySelectorAll('[data-explore-filter-chip]')
      const heroPanels = rootRef.current?.querySelectorAll('[data-explore-hero-panel]')
      const heroValues = rootRef.current?.querySelectorAll('[data-explore-hero-value]')
      const heroChart = rootRef.current?.querySelectorAll('[data-explore-chart]')
      const metaCards = rootRef.current?.querySelectorAll('[data-explore-meta-card]')
      const quickPickBlocks = rootRef.current?.querySelectorAll('[data-explore-quick-picks] > *')
      const quickPickButtons = rootRef.current?.querySelectorAll('[data-explore-quick-picks] button')
      const stockCards = rootRef.current?.querySelectorAll('[data-explore-grid] > *')
      const noResults = rootRef.current?.querySelectorAll('[data-explore-no-results]')

      const timeline = gsap.timeline({
        defaults: {
          ease: 'power3.out'
        }
      })

      if (filters?.length) {
        timeline.from(filters, {
          x: 18,
          opacity: 0,
          duration: 0.38,
          stagger: 0.05
        })
      }

      if (heroPanels?.length) {
        timeline.from(
          heroPanels,
          {
            x: 28,
            opacity: 0,
            duration: 0.5,
            stagger: 0.12
          },
          '-=0.14'
        )
      }

      if (heroValues?.length) {
        timeline.from(
          heroValues,
          {
            y: 18,
            opacity: 0,
            duration: 0.34,
            stagger: 0.06
          },
          '-=0.34'
        )
      }

      if (heroChart?.length) {
        timeline.from(
          heroChart,
          {
            y: 24,
            opacity: 0,
            duration: 0.48
          },
          '-=0.22'
        )
      }

      if (metaCards?.length) {
        timeline.from(
          metaCards,
          {
            y: 18,
            opacity: 0,
            duration: 0.34,
            stagger: 0.05
          },
          '-=0.28'
        )
      }

      if (quickPickBlocks?.length) {
        timeline.from(
          quickPickBlocks,
          {
            y: 14,
            opacity: 0,
            duration: 0.28,
            stagger: 0.05
          },
          '-=0.22'
        )
      }

      if (quickPickButtons?.length) {
        timeline.from(
          quickPickButtons,
          {
            y: 14,
            opacity: 0,
            duration: 0.24,
            stagger: 0.035
          },
          '-=0.16'
        )
      }

      if (stockCards?.length) {
        timeline.from(
          stockCards,
          {
            y: 22,
            opacity: 0,
            duration: 0.42,
            stagger: 0.04
          },
          '-=0.18'
        )
      } else if (noResults?.length) {
        timeline.from(
          noResults,
          {
            y: 20,
            opacity: 0,
            duration: 0.42
          },
          '-=0.1'
        )
      }
    }, rootRef)

    hasAnimatedRef.current = true
    return () => ctx.revert()
  }, [activeStock, filtered.length, status])

  return (
    <div ref={rootRef} className='space-y-6 max-w-7xl'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        {/*<input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder='Search trending symbols'
          className='h-9 w-full rounded-sm bg-muted/20 px-3 text-sm font-display text-foreground outline-none placeholder:text-muted-foreground/60 sm:max-w-xs'
        />*/}

        <div data-explore-filters className='flex gap-1.5 overflow-scroll'>
          {sectors.slice(0, 10).map((sector) => (
            <button
              key={sector}
              data-explore-filter-chip
              type='button'
              onClick={() => setSectorFilter(sector)}
              className={`px-1 md:px-4 h-6 rounded-sm text-sm font-display transition-all ${
                sectorFilter === sector
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}>
              {sector}
            </button>
          ))}
        </div>
      </div>

      {status === 'loading' && (
        <div className='rounded-md bg-border/5 p-4 sm:p-5'>
          <div className='space-y-2'>
            <div className='h-3 w-24 rounded-full bg-muted/60' />
            <div className='h-8 w-40 rounded-full bg-muted/60' />
          </div>
          <div className='mt-4 h-72 rounded-md bg-background/60' />
        </div>
      )}

      {status === 'error' && (
        <div className='rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-10 text-center'>
          <p className='font-medium text-foreground'>Failed to load trending Yahoo Finance data.</p>
          <p className='mt-1 text-sm text-muted-foreground'>{error}</p>
        </div>
      )}

      {status === 'ready' && activeStock ? (
        <div className='grid grid-cols-1 xl:grid-cols-[minmax(0,1.8fr)_20rem] gap-3'>
          <div data-explore-hero-panel className='rounded-md bg-border/5 p-2 sm:p-2'>
            <div className='flex gap-3 flex-row sm:items-start justify-between'>
              <div data-explore-hero-value className='space-y-1'>
                <div className='flex items-end gap-5'>
                  <h2 className='font-display text-3xl font-semibold tracking-tight text-foreground'>
                    {activeStock.symbol}
                  </h2>
                  <span className='pb-1 font-display text-sm text-foreground/70'>{activeStock.name}</span>
                </div>
              </div>

              <div data-explore-hero-value className='text-left sm:text-right'>
                <p className='text-2xl font-display font-semibold text-foreground ticker-font'>
                  {formatPriceValue(activeStock.price, activeStock.currency)}
                </p>
                <p
                  className={`text-xs md:text-sm font-mono ${(activeStock.change ?? 0) >= 0 ? 'text-foreground' : 'text-slate-500'}`}>
                  {formatPercentValue(activeStock.change)} today
                </p>
              </div>
            </div>

            <div data-explore-chart className='mt-4 h-72'>
              <EvilAreaChart
                data={activeStock.history}
                chartConfig={getPriceChartConfig(`${activeStock.symbol} price`, (activeStock.change ?? 0) >= 0)}
                xDataKey='label'
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

          <div data-explore-hero-panel className='rounded-md bg-border/5 p-2 md:p-5'>
            <div className='grid grid-cols-2 gap-3'>
              <div data-explore-meta-card className='rounded-xl bg-background/80 p-3'>
                <Eyebrow>Sector</Eyebrow>
                <p className='mt-2 text-sm font-medium text-foreground'>{activeStock.sector}</p>
              </div>
              <div data-explore-meta-card className='rounded-xl bg-background/80 p-3'>
                <Eyebrow>Market Cap</Eyebrow>
                <p className='mt-2 text-sm font-medium text-foreground'>{activeStock.mcap ?? 'N/A'}</p>
              </div>
              <div data-explore-meta-card className='rounded-xl bg-background/80 p-3'>
                <Eyebrow>Industry</Eyebrow>
                <p className='mt-2 text-sm font-medium text-foreground'>{activeStock.industry}</p>
              </div>
              <div data-explore-meta-card className='rounded-xl bg-background/80 p-3'>
                <Eyebrow>Profile</Eyebrow>
                <p className='text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground'></p>
                <Link
                  href={`/company/${activeStock.symbol}`}
                  className='mt-2 inline-flex text-sm font-medium text-primary transition-colors hover:text-foreground'>
                  View &rarr;
                </Link>
              </div>
            </div>

            <div data-explore-quick-picks className='md:mt-2 mt-4 space-y-3'>
              <Eyebrow>Related picks</Eyebrow>
              <div className='flex flex-wrap gap-2'>
                {filtered.slice(0, 8).map((stock) => (
                  <button
                    key={stock.symbol}
                    type='button'
                    aria-pressed={activeStock.symbol === stock.symbol}
                    onClick={() => setActiveSymbol(stock.symbol)}
                    className={`rounded-md border px-3 py-1.5 text-xs font-display transition-colors ${
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
      ) : null}

      {status === 'ready' && filtered.length === 0 && (
        <div
          data-explore-no-results
          className='rounded-2xl border border-dashed border-border/60 bg-muted/20 px-4 py-10 text-center'>
          <p className='font-medium text-foreground'>No trending stocks match the current filters.</p>
          <p className='mt-1 text-sm text-muted-foreground'>Try a broader search or switch sectors.</p>
        </div>
      )}

      {status === 'ready' && filtered.length > 0 && (
        <div data-explore-grid className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3'>
          {filtered.map((stock) => (
            <Stock
              key={stock.symbol}
              stock={stock}
              activeStock={activeStock ?? undefined}
              setActiveSymbol={setActiveSymbol}
              isPositive={(stock.change ?? 0) >= 0}
            />
          ))}
        </div>
      )}
    </div>
  )
}
