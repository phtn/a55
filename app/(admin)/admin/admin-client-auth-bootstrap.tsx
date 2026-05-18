'use client'

import { useFirebaseUser } from '@/lib/firebase/auth'
import { auth } from '@/lib/firebase/config'
import { signInWithCustomToken } from 'firebase/auth'
import { useEffect, useRef } from 'react'

type AdminClientTokenResponse = {
  error?: unknown
  token?: unknown
}

export function AdminClientAuthBootstrap() {
  const { hasAdminClaim, isLoading } = useFirebaseUser()
  const didAttemptBootstrapRef = useRef(false)

  useEffect(() => {
    if (!auth || isLoading || hasAdminClaim || didAttemptBootstrapRef.current) {
      return
    }

    const firebaseAuth = auth
    didAttemptBootstrapRef.current = true

    void fetch('/api/auth/admin-client-token', {
      method: 'POST',
      cache: 'no-store',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json'
      }
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as AdminClientTokenResponse | null

        if (!response.ok) {
          const message =
            typeof payload?.error === 'string' && payload.error.trim().length > 0
              ? payload.error
              : 'Unable to bootstrap admin client auth.'
          throw new Error(message)
        }

        if (typeof payload?.token !== 'string' || payload.token.trim().length === 0) {
          throw new Error('Admin client token response was invalid.')
        }

        await signInWithCustomToken(firebaseAuth, payload.token)
      })
      .catch((error) => {
        didAttemptBootstrapRef.current = false
        console.error('Failed to bootstrap admin Firebase client auth.', error)
      })
  }, [hasAdminClaim, isLoading])

  return null
}
