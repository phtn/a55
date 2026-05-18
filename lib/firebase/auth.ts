'use client'

import { getFirebaseCustomClaimsFromIdTokenResult, type FirebaseCustomClaims } from '@/lib/firebase/custom-claims'
import {
  GoogleAuthProvider,
  onIdTokenChanged,
  signInWithPopup,
  signOut,
  type User,
  type UserCredential
} from 'firebase/auth'
import { useEffect, useState } from 'react'

import { auth, isFirebaseConfigured } from './config'

const googleProvider = new GoogleAuthProvider()

googleProvider.setCustomParameters({
  prompt: 'select_account'
})

export async function signInWithGoogle(): Promise<UserCredential> {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase auth is not configured.')
  }

  return signInWithPopup(auth, googleProvider)
}

export function useFirebaseUser() {
  const [user, setUser] = useState<User | null>(null)
  const [customClaims, setCustomClaims] = useState<FirebaseCustomClaims>({})
  const [hasAdminClaim, setHasAdminClaim] = useState(false)
  const [isLoading, setIsLoading] = useState(Boolean(auth))

  useEffect(() => {
    if (!auth) return

    let isCancelled = false
    let latestTokenRequest = 0

    const unsubscribe = onIdTokenChanged(auth, (nextUser) => {
      latestTokenRequest += 1
      const requestId = latestTokenRequest

      setUser(nextUser)

      if (!nextUser) {
        setCustomClaims({})
        setHasAdminClaim(false)
        setIsLoading(false)
        return
      }

      void nextUser
        .getIdTokenResult()
        .then((tokenResult) => {
          if (isCancelled || requestId !== latestTokenRequest) {
            return
          }

          const nextCustomClaims = getFirebaseCustomClaimsFromIdTokenResult(tokenResult)
          setCustomClaims(nextCustomClaims)
          setHasAdminClaim(nextCustomClaims.admin === true)
        })
        .catch(() => {
          if (isCancelled || requestId !== latestTokenRequest) {
            return
          }

          setCustomClaims({})
          setHasAdminClaim(false)
        })
        .finally(() => {
          if (isCancelled || requestId !== latestTokenRequest) {
            return
          }

          setIsLoading(false)
        })
    })

    return () => {
      isCancelled = true
      unsubscribe()
    }
  }, [])

  return { customClaims, hasAdminClaim, isLoading, user }
}

export async function signOutUser(): Promise<void> {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase auth is not configured.')
  }

  await signOut(auth)
}
