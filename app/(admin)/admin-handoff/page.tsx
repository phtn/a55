'use client'

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
  const [appHomeHref, setAppHomeHref] = useState<string | null>(null)

  useEffect(() => {
    let isCancelled = false

    const bootstrapAdminSession = async () => {
      const hashParams = new URLSearchParams(window.location.hash.slice(1))
      const idToken = hashParams.get('idToken')
      const redirectTo = hashParams.get('redirectTo') ?? '/'

      window.history.replaceState(null, '', adminSubdomainHandoffPath)
      setAppHomeHref(toAppHomeHref())

      if (!idToken) {
        if (!isCancelled) {
          setErrorMessage('Missing Firebase ID token for the admin handoff.')
        }
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

          if (!isCancelled) {
            setErrorMessage(message)
          }
          return
        }

        const nextPath =
          typeof payload?.redirectTo === 'string' && payload.redirectTo.startsWith('/') ? payload.redirectTo : '/'

        window.location.replace(nextPath)
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to create the admin session.')
        }
      }
    }

    void bootstrapAdminSession()

    return () => {
      isCancelled = true
    }
  }, [])

  return (
    <main className='flex min-h-screen items-center justify-center px-6'>
      <div className='w-full max-w-md space-y-3 text-center'>
        <h1 className='font-display text-2xl font-medium tracking-tight'>Opening Admin</h1>
        <p className='text-sm text-muted-foreground'>
          {errorMessage ?? 'Finishing the admin sign-in on this subdomain.'}
        </p>
        {errorMessage && appHomeHref ? (
          <Link className='text-sm text-primary underline underline-offset-4' href={appHomeHref}>
            Back to app
          </Link>
        ) : null}
      </div>
    </main>
  )
}
