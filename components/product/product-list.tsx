'use client'

import { Icon, IconName } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { parseAsArrayOf, parseAsString, useQueryState } from 'nuqs'
import { Button } from '../ui/button'
import { Menu } from '../ui/menu'
import { ProductCard } from './product-card'

export interface Product {
  id: string
  icon: IconName
  title: string
  price: number
  description?: string
}

const PRODUCT_IDS = ['white', 'mase', 'ivey']
const arrayParser = parseAsArrayOf(parseAsString, ',')

export const ProductList = () => {
  const products: Product[] = [
    {
      id: 'white',
      title: 'Dana White',
      description: 'An King level tier. Suitable for mortals vulnerable to pain.',
      price: 15,
      icon: 'abstract'
    },
    {
      id: 'mase',
      title: 'Mikki Mase',
      description:
        'A Demigod level tier. Suitable for players who loves to be around bitches. These players are also known for their ability to wield and ride the lightning.',
      price: 30,
      icon: 'aquarius'
    },
    {
      id: 'ivey',
      title: 'Phil Ivey',
      description:
        'A Regicidal level tier. Suitable for players who knows exactly what they want. Ultra self-aware and can never be perturbed.',
      price: 60,
      icon: 'amethyst'
    }
  ]
  // let's wire up nuqs to handle the product selection
  const [selectedProduct, setSelectedProduct] = useQueryState('product', arrayParser.withDefault(PRODUCT_IDS))
  const handleProductSelect = (productId: string) => {
    setSelectedProduct([productId])
  }
  const handleViewAll = () => {
    setSelectedProduct(PRODUCT_IDS)
  }

  return (
    <section className='h-80 md:h-96'>
      <div className='min-h-84 md:min-h-96 rounded-md bg-linear-to-r from-border/5 via-border/20 to-border/5 px-4 py-2'>
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
        <div
          className={cn(
            'flex items-start justify-start p-4 md:p-8 h-64 md:h-75 bg-foreground/40 rounded-lg overflow-scroll',
            { 'bg-foreground/15': selectedProduct.length < 3 }
          )}>
          <ul className='flex items-center space-x-4 md:space-x-8'>
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
          {selectedProduct.length < 3 && (
            <div className='flex flex-col justify-between h-full w-full'>
              <div className='p-6'>
                <h2 className='font-poly font-bold text-2xl'>
                  {products.find((product) => product.id === selectedProduct[0])?.title}
                </h2>
                <p className='font-display'>
                  {products.find((product) => product.id === selectedProduct[0])?.description}
                </p>
              </div>
              <div className='flex items-center justify-between border ps-6'>
                <div className='flex items-center space-x-2'>
                  <Menu
                    popupClassName='justify-start'
                    items={[
                      {
                        id: 'eth',
                        label: 'Ethereum',
                        value: 'ethereum',
                        content: (
                          <Button
                            size='lg'
                            variant='ghost'
                            className='flex items-center justify-start space-x-1 rounded-sm h-10 font-poly font-semibold text-foreground text-base px-4 w-full'>
                            <Icon name='eth' className='size-4' />
                            <span>Ethereum</span>
                          </Button>
                        )
                      },
                      {
                        id: 'pol',
                        label: 'Polygon',
                        value: 'polygon',
                        content: (
                          <Button
                            size='lg'
                            variant='ghost'
                            className='flex items-center justify-start space-x-1 rounded-sm h-10 font-poly font-semibold text-foreground text-base px-4 w-full'>
                            <Icon name='pol' className='size-4' />
                            <span>Polygon</span>
                          </Button>
                        )
                      }
                    ]}>
                    <Button
                      size='lg'
                      variant='ghost'
                      className='flex items-center space-x-1 rounded-md h-12 font-poly font-semibold text-base px-4 bg-background/15'>
                      <span>Network</span>
                      <Icon name='arrow-drop-down' className='size-4' />
                    </Button>
                  </Menu>
                  <Button
                    size='lg'
                    variant='ghost'
                    className='flex items-center space-x-1 rounded-md h-12 font-poly font-semibold text-base px-4 bg-background/15'>
                    <span>Token</span>
                    <Icon name='arrow-drop-down' className='size-4' />
                  </Button>
                </div>
                <Button
                  size='lg'
                  className='flex items-center space-x-2 rounded-md h-12 font-poly font-semibold text-base px-8 italic'>
                  <span>Buy Now</span>
                  <Icon name='chevrons-right' className='size-6' />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
