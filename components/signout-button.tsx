'use client'

import { signOutUser } from '@/lib/firebase/auth'
import { clearFirebaseSession } from '@/lib/firebase/session'
import { Icon } from '@/lib/icons'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from './ui/button'

export function SignOutButton() {
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState<string | null>(null)

  const handleSignOut = async () => {
    setSignOutError(null)
    setIsSigningOut(true)

    try {
      await clearFirebaseSession()
      await signOutUser()
      router.replace('/')
    } catch (error) {
      setSignOutError(error instanceof Error ? error.message : 'Unable to sign out right now.')
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <div className='flex w-full'>
      <Button
        type='button'
        variant='ghost'
        disabled={isSigningOut}
        onClick={handleSignOut}
        className='w-full flex items-center justify-center rounded-[18px] border-white/10 bg-white/3 text-white transition-colors hover:bg-white/6'>
        <Icon name='x' />
      </Button>
      {signOutError ? (
        <p className='max-w-sm font-mono text-[10px] uppercase tracking-[0.24em] text-[#ff7d33]'>{signOutError}</p>
      ) : null}
    </div>
  )
}
