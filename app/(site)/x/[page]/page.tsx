import { AppShell } from '@/components/app-shell'
import { ConvexClientProvider } from '@/ctx/convex/client'
import { getRoutePageTitle } from '@/lib/page-titles'
import { type Page } from '@/types/dashboard'
import { Metadata } from 'next'
import { AnimatedContent } from './animated-content'

interface PageProps {
  params: Promise<{
    page: Page
  }>
}

export const generateMetadata = async ({ params }: PageProps): Promise<Metadata> => {
  const { page } = await params
  const title = getRoutePageTitle(page)

  return {
    title,
    description: `${title} page`,
    icons: [
      {
        rel: 'icon',
        type: 'image/svg+xml',
        sizes: '32x32',
        url: '/favicon-32x32.svg'
      }
    ]
  }
}

const Page = async ({ params }: PageProps) => {
  const { page } = await params
  return (
    <ConvexClientProvider>
      <AppShell>
        <AnimatedContent key={page} page={page} />
      </AppShell>
    </ConvexClientProvider>
  )
}
export default Page
