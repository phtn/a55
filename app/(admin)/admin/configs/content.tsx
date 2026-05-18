'use client'

import { Tab, Tabs } from '@/components/ui/tabs'
import { CryptoWallets } from './crypto-wallets'

export const Content = () => {
  const tabs: Tab[] = [{ value: 'wallets', label: 'Crypto Wallets', content: <CryptoWallets /> }]
  return (
    <section className='max-w-6xl space-y-4 md:space-y-8'>
      <div className='bg-background/70 p-6'>
        <Tabs tabs={tabs} />
      </div>
    </section>
  )
}
