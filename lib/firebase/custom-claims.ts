import type { UserIdentity } from 'convex/server'
import type { IdTokenResult } from 'firebase/auth'
import type { DecodedIdToken } from 'firebase-admin/auth'

export type FirebaseCustomClaimValue =
  | null
  | boolean
  | number
  | string
  | FirebaseCustomClaimValue[]
  | { [key: string]: FirebaseCustomClaimValue }

export type FirebaseCustomClaims = Record<string, FirebaseCustomClaimValue>

const firebaseStandardClaimKeys = new Set([
  'acr',
  'amr',
  'at_hash',
  'aud',
  'auth_time',
  'azp',
  'email',
  'email_verified',
  'exp',
  'family_name',
  'firebase',
  'given_name',
  'iat',
  'iss',
  'jti',
  'locale',
  'middle_name',
  'name',
  'nbf',
  'nonce',
  'phone_number',
  'picture',
  'profile',
  'sub',
  'tenant_id',
  'uid',
  'updated_at',
  'user_id',
  'website',
  'zoneinfo'
])

const convexIdentityStandardClaimKeys = new Set([
  'address',
  'birthday',
  'email',
  'emailVerified',
  'familyName',
  'gender',
  'givenName',
  'issuer',
  'language',
  'name',
  'nickname',
  'phoneNumber',
  'pictureUrl',
  'preferredUsername',
  'profileUrl',
  'subject',
  'timezone',
  'tokenIdentifier',
  'updatedAt'
])

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isFirebaseCustomClaimValue(value: unknown): value is FirebaseCustomClaimValue {
  if (value === null) {
    return true
  }

  if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
    return true
  }

  if (Array.isArray(value)) {
    return value.every(isFirebaseCustomClaimValue)
  }

  if (!isPlainObject(value)) {
    return false
  }

  return Object.values(value).every(isFirebaseCustomClaimValue)
}

export function isFirebaseCustomClaims(value: unknown): value is FirebaseCustomClaims {
  if (!isPlainObject(value)) {
    return false
  }

  return Object.values(value).every(isFirebaseCustomClaimValue)
}

function collectCustomClaims(
  source: Record<string, unknown> | null | undefined,
  reservedKeys: ReadonlySet<string>
): FirebaseCustomClaims {
  if (!source) {
    return {}
  }

  const customClaims: FirebaseCustomClaims = {}

  for (const [key, value] of Object.entries(source)) {
    if (reservedKeys.has(key) || !isFirebaseCustomClaimValue(value)) {
      continue
    }

    customClaims[key] = value
  }

  return customClaims
}

export function getFirebaseCustomClaimsFromTokenClaims(
  claims: Record<string, unknown> | null | undefined
): FirebaseCustomClaims {
  return collectCustomClaims(claims, firebaseStandardClaimKeys)
}

export function getFirebaseCustomClaimsFromIdTokenResult(
  tokenResult: Pick<IdTokenResult, 'claims'> | null | undefined
): FirebaseCustomClaims {
  return getFirebaseCustomClaimsFromTokenClaims((tokenResult?.claims as Record<string, unknown> | undefined) ?? null)
}

export function getFirebaseCustomClaimsFromDecodedToken(
  decodedToken: DecodedIdToken | null | undefined
): FirebaseCustomClaims {
  return getFirebaseCustomClaimsFromTokenClaims((decodedToken as Record<string, unknown> | undefined) ?? null)
}

export function getFirebaseCustomClaimsFromConvexIdentity(
  identity: UserIdentity | null | undefined
): FirebaseCustomClaims {
  return collectCustomClaims((identity as Record<string, unknown> | undefined) ?? null, convexIdentityStandardClaimKeys)
}
