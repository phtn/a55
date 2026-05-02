import { Fab } from '@/components/fab'
import { Sidebar } from '@/components/sidebar'
import { TopBar } from '@/components/topbar'
import type { ReactNode } from 'react'

export const AppShell = ({ children }: { children: ReactNode }) => {
  return (
    <div className='min-h-screen bg-background'>
      <div className='hidden lg:block'>
        <Sidebar />
      </div>

      <div className='lg:ml-54'>
        <TopBar />
        <main className='p-8 pb-28 lg:pb-16'>{children}</main>
      </div>

      <div className='lg:hidden'>
        <Fab />
      </div>
    </div>
  )
}
