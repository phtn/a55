'use client'

import { Icon } from '@/lib/icons'
import { adminSubdomainHandoffPath, stripAdminSubdomain } from '@/lib/routing/admin-subdomain'
import Link from 'next/link'
import { useEffect, useState } from 'react'

type AdminHandoffResponse = {
  error?: unknown
  redirectTo?: unknown
}

function toAppHomeHref() {
  const appUrl = new URL(window.location.href)
  appUrl.hostname = stripAdminSubdomain(appUrl.hostname)
  appUrl.pathname = '/'
  appUrl.search = ''
  appUrl.hash = ''
  return appUrl.toString()
}

export default function AdminHandoffPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const [appHomeHref, setAppHomeHref] = useState<string | null>(null)

  const runHandoff = async () => {
    const hashParams = new URLSearchParams(window.location.hash.slice(1))
    const idToken = hashParams.get('idToken')
    const redirectTo = hashParams.get('redirectTo') ?? '/admin'

    window.history.replaceState(null, '', adminSubdomainHandoffPath)
    setAppHomeHref(toAppHomeHref())

    if (!idToken) {
      setErrorMessage('Missing Firebase ID token for the admin handoff.')
      return
    }

    try {
      const response = await fetch('/api/auth/admin-handoff', {
        method: 'POST',
        cache: 'no-store',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          idToken,
          redirectTo
        })
      })

      const payload = (await response.json().catch(() => null)) as AdminHandoffResponse | null

      if (!response.ok) {
        const message =
          typeof payload?.error === 'string' && payload.error.trim().length > 0
            ? payload.error
            : 'Unable to create the admin session.'

        setErrorMessage(message)
        return
      }

      const nextPath =
        typeof payload?.redirectTo === 'string' && payload.redirectTo.startsWith('/') ? payload.redirectTo : '/admin'

      window.location.replace(nextPath)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to create the admin session.')
    }
  }

  useEffect(() => {
    let isCancelled = false

    const bootstrap = async () => {
      if (isCancelled) return
      setErrorMessage(null)
      setIsRetrying(false)
      await runHandoff()
    }

    void bootstrap()

    return () => {
      isCancelled = true
    }
    /// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleRetry = async () => {
    setIsRetrying(true)
    setErrorMessage(null)
    await runHandoff()
    setIsRetrying(false)
  }

  const statusMessage = errorMessage
    ? errorMessage
    : isRetrying
      ? 'Retrying secure admin session...'
      : 'Establishing secure admin session...'

  return (
    <main className='flex min-h-screen items-center justify-center px-6'>
      <div className='w-full max-w-md space-y-4 text-center'>
        <div className='flex flex-col items-center gap-3'>
          <h1 className='font-display text-2xl font-medium tracking-tight'>Opening Admin</h1>

          {!errorMessage && (
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <Icon name='spinner-ring' className='size-4 animate-spin' />
              <span>{statusMessage}</span>
            </div>
          )}

          {errorMessage && <p className='text-sm text-muted-foreground'>{statusMessage}</p>}
        </div>

        {errorMessage && (
          <div className='flex flex-col items-center gap-3 pt-2'>
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className='inline-flex items-center gap-2 rounded-sm border border-border px-4 py-1.5 text-sm font-medium transition hover:bg-foreground/5 disabled:opacity-50'>
              {isRetrying ? 'Retrying...' : 'Try again'}
            </button>

            {appHomeHref && (
              <Link className='text-sm text-primary underline underline-offset-4' href={appHomeHref}>
                Return to main app
              </Link>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
