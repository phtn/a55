import 'server-only'

import { getFirebaseCustomClaimsFromDecodedToken } from '@/lib/firebase/custom-claims'
import { stripAdminSubdomain } from '@/lib/routing/admin-subdomain'
import { cache } from 'react'
import type { DecodedIdToken } from 'firebase-admin/auth'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getFirebaseAdminAuth } from './admin'
import { firebaseSessionCookieName } from './session'

type VerifiedAdminSession = {
  customClaims: ReturnType<typeof getFirebaseCustomClaimsFromDecodedToken>
  decodedToken: DecodedIdToken
}

async function buildAppHomeUrl() {
  const headerStore = await headers()
  const host = headerStore.get('x-forwarded-host') ?? headerStore.get('host')

  if (!host) {
    return '/'
  }

  const protocol = headerStore.get('x-forwarded-proto') ?? 'http'
  const appUrl = new URL(`${protocol}://${host}`)
  appUrl.hostname = stripAdminSubdomain(appUrl.hostname)
  appUrl.pathname = '/'
  appUrl.search = ''
  appUrl.hash = ''
  return appUrl.toString()
}

export const getVerifiedAdminSession = cache(async (): Promise<VerifiedAdminSession | null> => {
  const auth = getFirebaseAdminAuth()

  if (!auth) {
    return null
  }

  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(firebaseSessionCookieName)?.value

  if (!sessionCookie) {
    return null
  }

  try {
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true)
    const customClaims = getFirebaseCustomClaimsFromDecodedToken(decodedToken)

    if (customClaims.admin !== true) {
      return null
    }

    return {
      customClaims,
      decodedToken
    }
  } catch {
    return null
  }
})

export async function requireAdminSession() {
  const session = await getVerifiedAdminSession()

  if (!session) {
    redirect(await buildAppHomeUrl())
  }

  return session
}
