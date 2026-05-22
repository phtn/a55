import { HyperList } from '@/components/hyperlist'
import { useTheme } from '@/components/theme-provider'
import { api } from '@/convex/_generated/api'
import { Doc } from '@/convex/_generated/dataModel'
import { useFirebaseUser } from '@/lib/firebase/auth'
import { useQuery } from 'convex/react'
import { PixelGrid } from 'three-px-react'

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
          <HyperList
            component={StakeItem}
            data={stakes}
            keyId='_id'
            itemStyle='border border-b-0 first:border-t last:border-b'
          />
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

const StakeItem = (stake: Doc<'stakes'>) => (
  <div className='h-20 flex items-center w-full p-2 gap-2'>
    <div className='bg-foreground/10 size-16 flex items-center justify-center font-poly font-semibold text-xl'>
      {stake.amount}
    </div>
    <p className='size-16 font-display flex items-center justify-center border'>{stake.level}</p>
    <p className='size-16 font-display flex items-center justify-center border'>{stake.title.split(' ').pop()}</p>
    <p className='size-16 font-display flex items-center justify-center border'>
      {stake._id.substring(stake._id.length - 5)}
    </p>
    <p className='size-16 font-display flex items-center justify-center border'>
      {stake.isActive ? 'Active' : 'Inactive'}
    </p>
  </div>
)
