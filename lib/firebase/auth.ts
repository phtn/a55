'use client'

import {
  GoogleAuthProvider,
  onAuthStateChanged,
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
  const [isLoading, setIsLoading] = useState(Boolean(auth))

  useEffect(() => {
    if (!auth) return

    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setIsLoading(false)
    })
  }, [])

  return { isLoading, user }
}

export async function signOutUser(): Promise<void> {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase auth is not configured.')
  }

  await signOut(auth)
}
