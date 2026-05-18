import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { Fab } from '@/components/fab'
import { OverviewPrefetchProvider } from '@/components/overview-prefetch-provider'
import { PageTitleProvider } from '@/components/page-title-provider'
import { TopBar } from '@/components/topbar'
import type { ReactNode } from 'react'

export const AdminShell = ({ children }: { children: ReactNode }) => {
  return (
    <PageTitleProvider>
      <OverviewPrefetchProvider>
        <div className='min-h-screen bg-background'>
          <div className='hidden lg:block'>
            <AdminSidebar />
          </div>

          <div className='lg:ml-54'>
            <TopBar />
            <main className='px-4 py-2 md:p-8 pb-28 lg:pb-16'>{children}</main>
          </div>

          <div className='lg:hidden'>
            <Fab />
          </div>
        </div>
      </OverviewPrefetchProvider>
    </PageTitleProvider>
  )
}
