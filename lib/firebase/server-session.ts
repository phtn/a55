import 'server-only'

import { api } from '@/convex/_generated/api'
import { getFirebaseSessionCookieDomain } from '@/lib/firebase/session'
import { getHostnameFromHostHeader } from '@/lib/routing/admin-subdomain'
import { fetchMutation } from 'convex/nextjs'
import type { DecodedIdToken } from 'firebase-admin/auth'
import type { NextRequest } from 'next/server'

function toNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

export function buildFirebaseTokenIdentifier(decodedToken: DecodedIdToken) {
  return `${decodedToken.iss}|${decodedToken.sub}`
}

export async function syncFirebaseSessionIdentityToConvex(decodedToken: DecodedIdToken) {
  await fetchMutation(api.users.m.upsertByTokenIdentifier, {
    tokenIdentifier: buildFirebaseTokenIdentifier(decodedToken),
    subject: decodedToken.sub,
    issuer: decodedToken.iss,
    name: toNullableString(decodedToken.name),
    nickname: toNullableString(decodedToken.firebase?.sign_in_provider),
    preferredUsername: toNullableString(decodedToken.email),
    profileUrl: null,
    pictureUrl: toNullableString(decodedToken.picture),
    email: toNullableString(decodedToken.email),
    phone: toNullableString(decodedToken.phone_number),
    emailVerified: typeof decodedToken.email_verified === 'boolean' ? decodedToken.email_verified : null
  })

  await fetchMutation(api.accounts.m.upsertByTokenId, {
    tokenIdentifier: buildFirebaseTokenIdentifier(decodedToken),
    sub: decodedToken.sub
  })
}

export function resolveFirebaseSessionCookieDomain(request: NextRequest) {
  const requestHostname =
    getHostnameFromHostHeader(request.headers.get('x-forwarded-host') ?? request.headers.get('host')) ??
    request.nextUrl.hostname

  return getFirebaseSessionCookieDomain(requestHostname)
}
