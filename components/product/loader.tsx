import { PixelGrid } from 'three-px-react'
import { useTheme } from '../theme-provider'

export const ProductLoader = () => {
  const { resolvedTheme } = useTheme()
  return (
    <section className='h-96'>
      <div className='h-full w-full border flex items-center justify-center'>
        <div className='flex items-center space-x-4'>
          <PixelGrid
            animation='snake'
            color={resolvedTheme === 'dark' ? '#f5f5f5' : '#CCC'}
            className='md:scale-96 scale-85'
            duration={1200}
          />
          <p className='font-display'>Loading</p>
        </div>
      </div>
    </section>
  )
}
