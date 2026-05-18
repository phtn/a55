'use client'

import { Icon } from '@/lib/icons'
import { type CommodityCardData, getCachedMarketsData, loadMarketsData, type MarketCardData } from '@/lib/markets-data'
import gsap from 'gsap'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

type AsyncStatus = 'loading' | 'ready' | 'error'

const formatIndexValue = (value: number | null) => (value === null ? 'N/A' : value.toLocaleString())

const formatCommodityValue = (value: number | null) => (value === null ? 'N/A' : `$${value.toLocaleString()}`)

const formatPercentValue = (value: number | null, digits: number) =>
  value === null ? 'N/A' : `${value >= 0 ? '+' : ''}${value.toFixed(digits)}%`

export const Markets = () => {
  const rootRef = useRef<HTMLDivElement>(null)
  const hasAnimatedRef = useRef(false)
  const cachedData = getCachedMarketsData()
  const [markets, setMarkets] = useState<
    {
      region: string
      markets: MarketCardData[]
    }[]
  >(() => cachedData?.markets ?? [])
  const [commodities, setCommodities] = useState<CommodityCardData[]>(() => cachedData?.commodities ?? [])
  const [status, setStatus] = useState<AsyncStatus>(() => (cachedData ? 'ready' : 'loading'))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') {
      hasAnimatedRef.current = false
    }
  }, [status])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const nextCachedData = getCachedMarketsData() ?? null

      setMarkets(nextCachedData?.markets ?? [])
      setCommodities(nextCachedData?.commodities ?? [])
      setStatus(nextCachedData ? 'ready' : 'loading')
      setError(null)

      try {
        const nextData = await loadMarketsData()

        if (cancelled) {
          return
        }

        setMarkets(nextData.markets)
        setCommodities(nextData.commodities)
        setStatus('ready')
      } catch (nextError) {
        if (cancelled) {
          return
        }

        setMarkets([])
        setCommodities([])
        setStatus('error')
        setError(nextError instanceof Error ? nextError.message : 'Unknown error')
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  useLayoutEffect(() => {
    if (!rootRef.current || status !== 'ready' || markets.length === 0 || hasAnimatedRef.current) {
      return
    }

    if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    const ctx = gsap.context(() => {
      const regionBlocks = rootRef.current?.querySelectorAll('[data-markets-region]')
      const marketCards = rootRef.current?.querySelectorAll('[data-markets-card]')
      const commoditiesSection = rootRef.current?.querySelectorAll('[data-markets-commodities]')
      const commodityCards = rootRef.current?.querySelectorAll('[data-markets-commodity-card]')

      const timeline = gsap.timeline({
        defaults: {
          ease: 'power3.out'
        }
      })

      if (regionBlocks?.length) {
        timeline.from(regionBlocks, {
          x: 28,
          opacity: 0,
          duration: 0.55,
          stagger: 0.12
        })
      }

      if (marketCards?.length) {
        timeline.from(
          marketCards,
          {
            y: 22,
            opacity: 0,
            duration: 0.42,
            stagger: 0.04
          },
          '-=0.34'
        )
      }

      if (commoditiesSection?.length) {
        timeline.from(
          commoditiesSection,
          {
            x: 18,
            opacity: 0,
            duration: 0.45
          },
          '-=0.28'
        )
      }

      if (commodityCards?.length) {
        timeline.from(
          commodityCards,
          {
            y: 18,
            opacity: 0,
            duration: 0.36,
            stagger: 0.05
          },
          '-=0.2'
        )
      }
    }, rootRef)

    hasAnimatedRef.current = true
    return () => ctx.revert()
  }, [markets.length, status])

  if (status === 'loading') {
    return (
      <div className='space-y-8 max-w-7xl'>
        <div className='space-y-3'>
          <div className='h-6 w-32 rounded-full bg-muted/60' />
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 w-full'>
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className='rounded-lg bg-foreground/2 p-4'>
                <div className='h-4 w-14 rounded-full bg-muted/50' />
                <div className='mt-4 h-4 w-24 rounded-full bg-muted/50' />
                <div className='mt-3 h-8 w-28 rounded-full bg-muted/60' />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className='space-y-8 max-w-7xl'>
        <div className='rounded-2xl border border-destructive/30 bg-destructive/5 p-5'>
          <p className='font-medium text-foreground'>Failed to load global market data</p>
          <p className='mt-1 text-sm text-muted-foreground'>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={rootRef} className='space-y-16 max-w-7xl'>
      {markets.map((region) => (
        <div key={region.region} data-markets-region>
          <h2 className='font-display font-semibold text-foreground text-2xl tracking-tight uppercase py-2'>
            {region.region}
          </h2>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 w-full'>
            {region.markets.map((market) => {
              const isPositive = (market.change ?? 0) >= 0
              return (
                <div key={market.symbol} data-markets-card className='bg-foreground/2 rounded-lg p-4 cursor-default'>
                  <div className='flex items-center justify-between'>
                    <div className='flex gap-2'>
                      <p className='font-display font-bold text-base tracking-wide'>{market.name}</p>
                      <div className='flex items-center text-[10px] font-mono px-1.5 py-0 rounded-sm bg-muted text-foreground/70'>
                        {market.location}
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          market.status === 'open' ? 'bg-foreground animate-pulse-glow' : 'bg-muted-foreground/30'
                        }`}
                      />
                      <Icon
                        name={isPositive ? 'trending-up' : 'trending-down'}
                        className={`w-3 h-3 ${isPositive ? 'text-foreground' : 'text-slate-500'}`}
                      />
                    </div>
                  </div>
                  <div className='flex items-end justify-between gap-3'>
                    <p className='text-lg font-display font-medium text-foreground ticker-font'>
                      {formatIndexValue(market.value)}
                    </p>
                    <span className={`text-lg font-light ${isPositive ? 'text-foreground' : 'text-slate-500'}`}>
                      {formatPercentValue(market.change, 2)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <div data-markets-commodities>
        <h2 className='font-display font-medium text-muted-foreground text-xs uppercase tracking-widest mb-3'>
          Commodities
        </h2>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3'>
          {commodities.map((commodity) => {
            const isPositive = (commodity.change ?? 0) >= 0
            return (
              <div key={commodity.symbol} data-markets-commodity-card className='glass-panel-hover rounded-xl p-4'>
                <p className='font-display font-medium text-foreground text-base'>{commodity.name}</p>
                <p className='text-[10px] text-muted-foreground font-mono mt-0.5'>per {commodity.unit}</p>
                <div className='flex items-end justify-between mt-3 gap-3'>
                  <p className='text-lg font-display font-semibold text-foreground ticker-font'>
                    {formatCommodityValue(commodity.price)}
                  </p>
                  <span className={`text-xs font-mono ${isPositive ? 'text-foreground' : 'text-slate-500'}`}>
                    {formatPercentValue(commodity.change, 1)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
