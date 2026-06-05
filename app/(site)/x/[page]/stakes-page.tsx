import { HyperList } from '@/components/hyperlist'
import { useTheme } from '@/components/theme-provider'
import { api } from '@/convex/_generated/api'
import { Doc } from '@/convex/_generated/dataModel'
import { useFirebaseUser } from '@/lib/firebase/auth'
import { useQuery } from 'convex/react'
import { PixelGrid } from 'three-px-react'

import { Button } from '@/components/ui/button'
import { Icon, IconName } from '@/lib/icons'
import Image from 'next/image'

export const generateMetadata = async () => {
  return {
    title: 'Stakes',
    description: `Stakes page`,
    icons: [
      {
        rel: 'icon',
        type: 'image/svg+xml',
        sizes: '32x32',
        url: '@/app/favicon.ico'
      }
    ]
  }
}
export const Stakes = () => {
  const { user } = useFirebaseUser()
  const { resolvedTheme } = useTheme()
  const accounts = useQuery(api.accounts.q.getAccountsBySub, user?.uid ? { sub: user.uid } : 'skip')
  const account = accounts?.[0] ?? null
  const stakeIds = account?.stakes ?? null
  const stakes = useQuery(api.stakes.q.listStakesById, stakeIds ? { ids: stakeIds } : 'skip')

  return (
    <div className='w-6xl'>
      {stakes ? (
        <div className=''>
          <HyperList component={StakeItem} data={stakes} keyId='_id' container='space-y-8' />
        </div>
      ) : (
        <PixelGrid
          animation='snake'
          color={resolvedTheme === 'dark' ? '#f5f5f5' : '#CCC'}
          className='md:scale-96 scale-85'
          duration={1200}
        />
      )}
    </div>
  )
}

export function StakeItem(stake: Doc<'stakes'>) {
  return (
    <div className='w-full bg-gray-100 rounded-3xl p-8 md:p-12 lg:p-16 relative overflow-hidden'>
      <p className='absolute top-5 right-6 font-mono text-background/50 text-xs tracking-widest'>{stake._id}</p>
      <Image
        width={500}
        height={500}
        src={'/web-app-manifest-512x512.png'}
        alt={'69'}
        className='absolute w-fit h-full object-contain transform transition-transform duration-300 top-0 right-0 scale-250 opacity-4'
      />
      <div className='flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12'>
        {/* Left Content Section */}
        <div className='flex flex-col gap-6 lg:gap-8 flex-1'>
          <div>
            <h1 className='text-3xl md:text-4xl lg:text-5xl font-poly font-bold text-black tracking-tight mb-1'>
              {stake.title.split(' ').pop()}
            </h1>
            <p className='font-display text-lg md:text-xl text-gray-600'>₱ {stake.amount}K</p>
          </div>

          <Button
            onClick={undefined}
            className='w-fit bg-black hover:bg-gray-900 text-white text-lg px-8 py-6 rounded-full font-semibold transition-all duration-200'>
            Activate
          </Button>
        </div>

        {/* Right Image Section */}
        <div className='flex-1 w-full flex justify-center relative'>
          <div className='relative w-full max-w-md max-h-36 flex justify-end'>
            <Icon name={lmap[stake.level]} className='size-44 text-[#333]' />
          </div>
        </div>
      </div>
    </div>
  )
}

const lmap: Record<number, IconName> = {
  1: 'cash',
  2: 'diamond-hard',
  3: 'crystal-growth',
  4: 'cash',
  5: 'cash'
}
