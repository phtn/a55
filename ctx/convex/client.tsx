'use client'

import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react'
import { useMemo, type ReactNode } from 'react'

import { useFirebaseConvexAuth } from '@/hooks/use-firebase-convex-auth'
import { ConvexUserSync } from './sync'

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const convex = useMemo(() => {
    if (!convexUrl) {
      throw new Error('NEXT_PUBLIC_CONVEX_URL is not set')
    }

    return new ConvexReactClient(convexUrl)
  }, [])

  return (
    <ConvexProviderWithAuth client={convex} useAuth={useFirebaseConvexAuth}>
      <ConvexUserSync />
      {children}
    </ConvexProviderWithAuth>
  )
}
