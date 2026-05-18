import { AppShell } from '@/components/app-shell'
import { CompanyPriceClient } from './company-price-client'

interface CompanyPageProps {
  params: Promise<{
    symbol: string
  }>
}

const CompanyPage = async ({ params }: CompanyPageProps) => {
  const { symbol } = await params

  return (
    <AppShell>
      <CompanyPriceClient key={symbol.toUpperCase()} symbol={symbol.toUpperCase()} />
    </AppShell>
  )
}

export default CompanyPage
