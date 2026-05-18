import { AppShell } from '@/components/app-shell'
import { ConvexClientProvider } from '@/ctx/convex/client'
import { Metadata } from 'next'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { Content } from './content'

interface PageProps {
  params: Promise<{ account: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const account = (await params).account

  return {
    title: `Account`,
    description: `Dashboard: ${account}`
  }
}

export default async function X() {
  return (
    <ConvexClientProvider>
      <NuqsAdapter>
        <AppShell>
          <Content />
        </AppShell>
      </NuqsAdapter>
    </ConvexClientProvider>
  )
}
