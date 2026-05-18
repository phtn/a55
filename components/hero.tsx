'use client'

import { SplitFlapAudioProvider, SplitFlapMuteToggle, SplitFlapText } from '@/components/split-flap-text'
import { signInWithGoogle, useFirebaseUser } from '@/lib/firebase/auth'
import { isFirebaseConfigured } from '@/lib/firebase/config'
import { createFirebaseSession } from '@/lib/firebase/session'
import { Icon } from '@/lib/icons'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useRouter } from 'next/navigation'
import { Ref, useEffect, useRef, useState } from 'react'
import { SignOutButton } from './signout-button'
import { Button } from './ui/button'

gsap.registerPlugin(ScrollTrigger)

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { isLoading, user } = useFirebaseUser()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [signInError, setSignInError] = useState<string | null>(null)

  useEffect(() => {
    if (!sectionRef.current || !contentRef.current) return

    const ctx = gsap.context(() => {
      gsap.to(contentRef.current, {
        y: -100,
        opacity: 0,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1
        }
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  useEffect(() => {
    router.prefetch('/x')
  }, [router])

  const handlePrimaryAction = async () => {
    setSignInError(null)
    setIsSigningIn(true)

    try {
      if (user) {
        await createFirebaseSession(await user.getIdToken(true))
        router.push('/x')
        return
      }

      const credential = await signInWithGoogle()
      await createFirebaseSession(await credential.user.getIdToken(true))
      router.push('/x')
    } catch (error) {
      setSignInError(error instanceof Error ? error.message : 'Google sign-in failed. Please try again.')
    } finally {
      setIsSigningIn(false)
    }
  }

  const signInLabel = isLoading
    ? 'Checking session...'
    : isSigningIn
      ? 'Connecting...'
      : user
        ? 'Open Dashboard'
        : 'Sign in with Google'

  return (
    <section
      ref={sectionRef}
      id='hero'
      className='relative min-h-screen flex items-center pl-6 md:pl-28 pr-6 md:pr-12 overflow-hidden'>
      <Hero
        contentRef={contentRef}
        isSigningIn={isSigningIn}
        isFirebaseConfigured={isFirebaseConfigured}
        isLoading={isLoading}
        handlePrimaryAction={handlePrimaryAction}
        signInLabel={signInLabel}
        signInError={signInError}
      />

      <div className='fixed bottom-8 right-8 md:bottom-12 md:right-12'>
        <SignOutButton />
        <div className='border border-border px-3 py-1 font-cm text-[8px] lowercase tracking-widest text-muted-foreground'>
          stake-st v0.10
        </div>
      </div>
    </section>
  )
}

interface HeroProps {
  contentRef: Ref<HTMLDivElement>
  isSigningIn: boolean
  isFirebaseConfigured: boolean
  isLoading: boolean
  handlePrimaryAction: VoidFunction
  signInLabel: string
  signInError: string | null
}
const Hero = ({
  contentRef,
  isSigningIn,
  isFirebaseConfigured,
  isLoading,
  handlePrimaryAction,
  signInLabel,
  signInError
}: HeroProps) => {
  return (
    <div ref={contentRef} className='flex flex-col items-center flex-1 justify-center w-full grayscale'>
      <SplitFlapAudioProvider>
        <div className='relative'>
          <SplitFlapText text='stake*street' speed={64} size='2.5rem' iconName='bet69' />
          <div className='mt-4 hidden'>
            <SplitFlapMuteToggle />
          </div>
        </div>
      </SplitFlapAudioProvider>

      <div className='relative z-200 flex w-full flex-col items-center justify-center mt-4'>
        <Button
          type='button'
          variant='secondary'
          disabled={!isFirebaseConfigured || isSigningIn || isLoading}
          onClick={handlePrimaryAction}
          className='group rounded-sm inline-flex w-full max-w-[20rem] h-12 items-center justify-center gap-4 px-6 py-3 font-poly font-semibold text-foreground/70 dark:text-background text-base bg-accent transition-all duration-200 dark:bg-white dark:hover:border-accent hover:border-foreground dark:hover:bg-foreground hover:bg-foreground hover:text-white dark:hover:text-background'>
          <p>{signInLabel}</p>
          {!signInLabel.includes('google') && (isSigningIn || isLoading) && (
            <Icon name={isSigningIn || isLoading ? 'spinner-ring' : 'arrow-right'} />
          )}
        </Button>
        {!isFirebaseConfigured ? (
          <p className='mt-4 font-mono text-xs uppercase tracking-[0.24em] text-foreground/40'>auth not configured.</p>
        ) : null}
        {signInError ? (
          <p className='mt-2 max-w-sm text-center font-mono text-[10px] uppercase tracking-[0.24em] text-destructive'>
            {signInError}
          </p>
        ) : null}
      </div>
    </div>
  )
}
