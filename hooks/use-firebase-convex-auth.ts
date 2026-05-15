'use client'

import { useMemo } from 'react'

import { useFirebaseUser } from '@/lib/firebase/auth'

export function useFirebaseConvexAuth() {
  const { isLoading, user } = useFirebaseUser()

  return useMemo(
    () => ({
      isLoading,
      isAuthenticated: Boolean(user),
      fetchAccessToken: async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
        if (!user) {
          return null
        }

        return await user.getIdToken(forceRefreshToken)
      }
    }),
    [isLoading, user]
  )
}
