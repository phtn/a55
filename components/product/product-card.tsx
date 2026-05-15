import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Icon } from '@/lib/icons'
import { Product } from './product-list'

interface ProductCardProps {
  product: Product
  onSelect: (productId: string) => void
  isSelected?: boolean
}

export const ProductCard = ({ product, onSelect }: ProductCardProps) => {
  const handleSelect = () => onSelect(product.id)
  return (
    <Card className='w-2xs p-0 rounded-md'>
      <CardContent className='relative flex flex-col p-0'>
        <div className='relative flex items-center justify-center h-40 w-full overflow-hidden bg-foreground/10'>
          <Icon name={product.icon} className='size-96 text-background' />
        </div>

        <p className='absolute top-6 left-6 font-poly font-semibold text-foreground text-center text-lg'>
          {product.description}
        </p>
        <div className='flex flex-col items-center border-t border-border/50'>
          <Button
            variant='default'
            onClick={handleSelect}
            className='w-full rounded-lg font-poly font-bold text-xl h-12'
            size='lg'>
            {product.price}K
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
