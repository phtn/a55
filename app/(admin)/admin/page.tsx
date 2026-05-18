import { Metadata } from 'next'
import { Content } from './content'

export const metadata: Metadata = {
  title: 'Admin',
  description: 'Site Administration',
  icons: [
    {
      rel: 'icon',
      type: 'image/svg+xml',
      sizes: '32x32',
      url: '/favicon-32x32.svg'
    }
  ]
}
export default function AdminPage() {
  return <Content />
}
