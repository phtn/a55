import { ConvexClientProvider } from '@/ctx/convex/client'
import { requireAdminSession } from '@/lib/firebase/server-auth'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import type { ReactNode } from 'react'
import { AdminClientAuthBootstrap } from './admin-client-auth-bootstrap'
import { AdminShell } from './admin-shell'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdminSession()

  return (
    <ConvexClientProvider>
      <AdminClientAuthBootstrap />
      <NuqsAdapter>
        <AdminShell>{children}</AdminShell>
      </NuqsAdapter>
    </ConvexClientProvider>
  )
}
