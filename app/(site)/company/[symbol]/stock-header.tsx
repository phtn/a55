import { Eyebrow } from '@/components/ui/eyebrow'
import { formatNullableCurrency, formatPercentValue, formatRecommendation } from '@/lib/helpers/formatters'
import { Icon } from '@/lib/icons'

interface StockHeaderProps {
  analystRecommendation?: string
  quoteType: string
  exchangeName: string
  symbol: string
  trendPercent: number | null
  latestPrice: number | null
  isPositive: boolean
  currencyCode: string
}
export const StockHeader = ({
  analystRecommendation,
  quoteType,
  exchangeName,
  symbol,
  trendPercent,
  latestPrice,
  isPositive,
  currencyCode
}: StockHeaderProps) => {
  return (
    <div className='flex items-center justify-between w-full'>
      <div data-animate='header-value'>
        <div className='md:flex flex-wrap md:items-end gap-2 font-display'>
          <div>
            {analystRecommendation && (
              <div className='flex items-center space-x-px font-display text-foreground text-[8px] italic uppercase tracking-widest'>
                <Icon name='arrow-right' className='size-3' />
                <span>{formatRecommendation(analystRecommendation)}</span>
              </div>
            )}
            <h1 className='font-display font-semibold md:text-3xl text-2xl tracking-tight text-foreground'>{symbol}</h1>
          </div>
        </div>
        <Eyebrow>
          {quoteType} on {exchangeName}
        </Eyebrow>
      </div>
      <div data-animate='header-value' className='text-right'>
        {trendPercent !== null && (
          <div
            className={`text-sm font-display flex items-center justify-end space-x-1 ${isPositive ? 'text-foreground' : 'text-slate-500'}`}>
            <Icon name={isPositive ? 'trending-up' : 'trending-down'} className='size-4' />
            <span>{formatPercentValue(trendPercent)}</span>
          </div>
        )}
        <p className='text-2xl font-display font-semibold text-foreground ticker-font'>
          {formatNullableCurrency(latestPrice, currencyCode)}
        </p>
      </div>
    </div>
  )
}
