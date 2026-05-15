'use client'

import { useConvexAuth, useMutation } from 'convex/react'
import { useEffect } from 'react'

import { api } from '@/convex/_generated/api'

export function ConvexUserSync() {
  const { isAuthenticated } = useConvexAuth()
  const syncCurrentUser = useMutation(api.users.m.syncCurrentUser)

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    void syncCurrentUser().catch((error) => {
      console.error('Failed to sync the current Convex user.', error)
    })
  }, [isAuthenticated, syncCurrentUser])

  return null
}
