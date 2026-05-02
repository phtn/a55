import { AppShell } from '@/components/app-shell'
import { Metadata } from 'next'
import { AnimatedContent } from './animated-content'

interface PageProps {
  params: Promise<{
    category: string
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
  const { category } = await params
  return (
    <AppShell>
      <AnimatedContent key={category} category={category} />
    </AppShell>
  )
}
export default Page
