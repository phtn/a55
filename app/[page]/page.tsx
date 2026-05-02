import { AppShell } from '@/components/app-shell'
import { type Page } from '@/types/dashboard'
import { Metadata } from 'next'
import { AnimatedContent } from './animated-content'

interface PageProps {
  params: Promise<{
    page: Page
  }>
}

export const metadata: Metadata = {
  title: 'Category',
  description: 'description',
  icons: [
    {
      rel: 'icon',
      type: 'image/svg+xml',
      sizes: '32x32',
      url: '/favicon-32x32.svg'
    }
  ]
}

const Page = async ({ params }: PageProps) => {
  const { page } = await params
  return (
    <AppShell>
      <AnimatedContent key={page} page={page} />
    </AppShell>
  )
}
export default Page
