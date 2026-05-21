import { Metadata } from 'next'
import { Content } from './content'

export const metadata: Metadata = {
  title: 'title',
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
const Page = async () => <Content />
export default Page
