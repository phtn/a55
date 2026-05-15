'use client'

import { Icon, IconName } from '@/lib/icons'
import { parseAsArrayOf, parseAsString, useQueryState } from 'nuqs'
import { Button } from '../ui/button'
import { ProductCard } from './product-card'

export interface Product {
  id: string
  icon: IconName
  title: string
  price: number
  description?: string
}

const arrayParser = parseAsArrayOf(parseAsString, ',')

export const ProductList = () => {
  const products: Product[] = [
    { id: 'entry', title: '', description: 'Entry Level', price: 15, icon: 'abstract' },
    { id: 'boss', title: '', description: 'Boss Level', price: 30, icon: 'aquarius' },
    { id: 'vip', title: '', description: 'VIP Level', price: 60, icon: 'amethyst' }
  ]
  // let's wire up nuqs to handle the product selection
  const [selectedProduct, setSelectedProduct] = useQueryState(
    'product',
    arrayParser.withDefault(['entry', 'boss', 'vip'])
  )
  const handleProductSelect = (productId: string) => {
    setSelectedProduct([productId])
  }
  const handleViewAll = () => {
    setSelectedProduct(['entry', 'boss', 'vip'])
  }

  return (
    <section className='h-96'>
      <div className='min-h-96 rounded-md border border-border/60 bg-border/20 px-4 py-2'>
        <div className='flex items-center justify-between'>
          <h2 className='flex items-center space-x-3 h-14 font-display font-medium'>
            <Icon name='tag-chevron' className='opacity-80' />
            <span>Add Stake</span>
          </h2>
          {selectedProduct.length < 3 && (
            <Button onClick={handleViewAll} variant='ghost'>
              View All
            </Button>
          )}
        </div>
        <ul className='flex items-center justify-start space-x-8 py-8 px-8 h-75 bg-foreground/80 rounded-sm'>
          {products
            .filter((product) => selectedProduct.includes(product.id))
            .map((product) => (
              <li key={product.id} className=''>
                <ProductCard
                  product={product}
                  isSelected={selectedProduct.includes(product.id)}
                  onSelect={handleProductSelect}
                />
              </li>
            ))}
        </ul>
      </div>
    </section>
  )
}
