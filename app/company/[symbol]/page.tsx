import { AppShell } from '@/components/app-shell'
import { CompanyPriceClient } from './company-price-client'

interface CompanyPageProps {
  params: Promise<{
    symbol: string
  }>
  searchParams: Promise<{
    cid?: string
    tid?: string
  }>
}

const parseSearchNumber = (value: string | undefined) => {
  if (!value) {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const CompanyPage = async ({ params, searchParams }: CompanyPageProps) => {
  const [{ symbol }, query] = await Promise.all([params, searchParams])
  const cid = parseSearchNumber(query.cid)
  const tid = parseSearchNumber(query.tid)

  return (
    <AppShell>
      <CompanyPriceClient symbol={symbol.toUpperCase()} cid={cid} tid={tid} />
    </AppShell>
  )
}

export default CompanyPage
