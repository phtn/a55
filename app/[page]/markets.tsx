import { Icon } from '@/lib/icons'

const GLOBAL_MARKETS = [
  {
    region: 'Americas',
    markets: [
      { name: 'S&P 500', location: 'US', value: 5248.49, change: 0.85, status: 'open' },
      { name: 'NASDAQ', location: 'US', value: 16428.82, change: 1.14, status: 'open' },
      { name: 'DOW', location: 'US', value: 39127.14, change: -0.11, status: 'open' },
      { name: 'TSX', location: 'CA', value: 22145.3, change: 0.42, status: 'open' },
      { name: 'BOVESPA', location: 'BR', value: 128432.5, change: -0.68, status: 'closed' }
    ]
  },
  {
    region: 'Europe',
    markets: [
      { name: 'FTSE 100', location: 'UK', value: 8164.12, change: 0.32, status: 'closed' },
      { name: 'DAX', location: 'DE', value: 18384.35, change: 0.71, status: 'closed' },
      { name: 'CAC 40', location: 'FR', value: 8088.24, change: 0.54, status: 'closed' },
      { name: 'STOXX 50', location: 'EU', value: 5026.18, change: 0.48, status: 'closed' }
    ]
  },
  {
    region: 'Asia Pacific',
    markets: [
      { name: 'NIKKEI 225', location: 'JP', value: 40168.07, change: 1.28, status: 'closed' },
      { name: 'HANG SENG', location: 'HK', value: 16512.92, change: -1.42, status: 'closed' },
      { name: 'SHANGHAI', location: 'CN', value: 3048.97, change: 0.18, status: 'closed' },
      { name: 'ASX 200', location: 'AU', value: 7824.3, change: 0.62, status: 'closed' },
      { name: 'KOSPI', location: 'KR', value: 2674.15, change: -0.34, status: 'closed' }
    ]
  }
]

const COMMODITIES = [
  { name: 'Gold', unit: 'oz', price: 2341.6, change: 0.6 },
  { name: 'Silver', unit: 'oz', price: 27.84, change: 1.2 },
  { name: 'Crude Oil (WTI)', unit: 'bbl', price: 78.42, change: -1.3 },
  { name: 'Natural Gas', unit: 'MMBtu', price: 1.82, change: -2.4 },
  { name: 'Copper', unit: 'lb', price: 4.21, change: 0.8 }
]

export const Markets = () => {
  return (
    <div className='space-y-8 max-w-7xl'>
      {/* Regions */}
      {GLOBAL_MARKETS.map((region) => (
        <div
          key={region.region}
          // initial={{ opacity: 0, y: 20 }}
          // animate={{ opacity: 1, y: 0 }}
          // transition={{ delay: ri * 0.1 }}
        >
          <h2 className='font-display font-bold text-slate-500 text-xl tracking-widest uppercase mb-3'>
            {region.region}
          </h2>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 w-full'>
            {region.markets.map((m) => {
              const isPositive = m.change >= 0
              return (
                <div key={m.name} className='bg-foreground/2 rounded-lg p-4 cursor-default'>
                  <div className='flex items-center justify-between mb-2'>
                    <div className='flex items-center gap-2'>
                      <span className='text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground'>
                        {m.location}
                      </span>
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${m.status === 'open' ? 'bg-foreground animate-pulse-glow' : 'bg-muted-foreground/30'}`}
                      />
                    </div>
                    {isPositive ? (
                      <Icon name='arrow-right' className='w-3 h-3 text-foreground' />
                    ) : (
                      <Icon name='arrow-right' className='w-3 h-3 text-slate-500' />
                    )}
                  </div>
                  <p className='text-sm font-medium text-slate-500'>{m.name}</p>
                  <div className='flex items-end justify-between mt-2'>
                    <p className='text-2xl font-display font-semibold text-foreground ticker-font'>
                      {m.value.toLocaleString()}
                    </p>
                    <span className={`text-xs font-mono ${isPositive ? 'text-foreground' : 'text-slate-500'}`}>
                      {isPositive ? '+' : ''}
                      {m.change.toFixed(2)}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Commodities */}
      <div
      // initial={{ opacity: 0, y: 20 }}
      // animate={{ opacity: 1, y: 0 }}
      // transition={{ delay: 0.4 }}
      >
        <h2 className='text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3'>Commodities</h2>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3'>
          {COMMODITIES.map((c) => {
            const isPositive = c.change >= 0
            return (
              <div key={c.name} className='glass-panel-hover rounded-xl p-4'>
                <p className='text-sm font-medium text-foreground'>{c.name}</p>
                <p className='text-[10px] text-muted-foreground font-mono mt-0.5'>per {c.unit}</p>
                <div className='flex items-end justify-between mt-3'>
                  <p className='text-lg font-mono font-semibold text-foreground ticker-font'>
                    ${c.price.toLocaleString()}
                  </p>
                  <span className={`text-xs font-mono ${isPositive ? 'text-foreground' : 'text-slate-500'}`}>
                    {isPositive ? '+' : ''}
                    {c.change.toFixed(1)}%
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
