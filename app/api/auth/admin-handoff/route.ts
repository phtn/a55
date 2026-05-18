import { getFirebaseAdminAuth } from '@/lib/firebase/admin'
import { getFirebaseCustomClaimsFromDecodedToken } from '@/lib/firebase/custom-claims'
import {
  firebaseSessionCookieMaxAgeMs,
  firebaseSessionCookieMaxAgeSeconds,
  firebaseSessionCookieName
} from '@/lib/firebase/session'
import { resolveFirebaseSessionCookieDomain, syncFirebaseSessionIdentityToConvex } from '@/lib/firebase/server-session'
import { getHostnameFromHostHeader, stripAdminSubdomain } from '@/lib/routing/admin-subdomain'
import { NextResponse, type NextRequest } from 'next/server'

export const runtime = 'nodejs'

type AdminHandoffBody = {
  idToken?: unknown
  redirectTo?: unknown
}

type AdminHandoffRequest = {
  idToken: string | null
  redirectPath: string
  responseMode: 'json' | 'redirect'
}

function getRequestUrl(request: NextRequest) {
  const requestUrl = request.nextUrl.clone()
  const requestHostname =
    getHostnameFromHostHeader(request.headers.get('x-forwarded-host') ?? request.headers.get('host')) ??
    request.nextUrl.hostname

  requestUrl.hostname = requestHostname
  return requestUrl
}

function toAppHomeUrl(request: NextRequest) {
  const appUrl = getRequestUrl(request)
  appUrl.hostname = stripAdminSubdomain(appUrl.hostname)
  appUrl.pathname = '/'
  appUrl.search = ''
  appUrl.hash = ''
  return appUrl
}

function normalizeRedirectPath(redirectTo: unknown) {
  return typeof redirectTo === 'string' && redirectTo.startsWith('/') ? redirectTo : '/'
}

function toAdminRedirectUrl(request: NextRequest, redirectPath: string) {
  const redirectUrl = getRequestUrl(request)
  redirectUrl.pathname = redirectPath
  redirectUrl.search = ''
  redirectUrl.hash = ''
  return redirectUrl
}

function getContentType(request: NextRequest) {
  return (request.headers.get('content-type') ?? '').toLowerCase()
}

async function readAdminHandoffRequest(request: NextRequest): Promise<AdminHandoffRequest> {
  const contentType = getContentType(request)
  const responseMode = contentType.includes('application/json') ? 'json' : 'redirect'

  if (responseMode === 'json') {
    const body = (await request.json().catch(() => null)) as AdminHandoffBody | null

    return {
      idToken: typeof body?.idToken === 'string' ? body.idToken : null,
      redirectPath: normalizeRedirectPath(body?.redirectTo),
      responseMode
    }
  }

  const formData = await request.formData()

  return {
    idToken: typeof formData.get('idToken') === 'string' ? (formData.get('idToken') as string) : null,
    redirectPath: normalizeRedirectPath(formData.get('redirectTo')),
    responseMode
  }
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store'
    }
  })
}

export async function POST(request: NextRequest) {
  const appHomeUrl = toAppHomeUrl(request)
  const expectsJson = getContentType(request).includes('application/json')

  try {
    const auth = getFirebaseAdminAuth()

    if (!auth) {
      return expectsJson
        ? jsonResponse({ error: 'Firebase Admin credentials are not configured.', redirectTo: appHomeUrl.toString() }, 500)
        : NextResponse.redirect(appHomeUrl, 303)
    }

    const { idToken, redirectPath, responseMode } = await readAdminHandoffRequest(request)

    if (typeof idToken !== 'string' || idToken.trim().length === 0) {
      return responseMode === 'json'
        ? jsonResponse({ error: 'Missing Firebase ID token.', redirectTo: appHomeUrl.toString() }, 400)
        : NextResponse.redirect(appHomeUrl, 303)
    }

    const decodedToken = await auth.verifyIdToken(idToken)
    const customClaims = getFirebaseCustomClaimsFromDecodedToken(decodedToken)

    if (customClaims.admin !== true) {
      return responseMode === 'json'
        ? jsonResponse({ error: 'Admin access is required.', redirectTo: appHomeUrl.toString() }, 403)
        : NextResponse.redirect(appHomeUrl, 303)
    }

    await syncFirebaseSessionIdentityToConvex(decodedToken)

    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: firebaseSessionCookieMaxAgeMs
    })

    const response =
      responseMode === 'json'
        ? jsonResponse({ ok: true, redirectTo: redirectPath })
        : NextResponse.redirect(toAdminRedirectUrl(request, redirectPath), 303)
    const cookieDomain = resolveFirebaseSessionCookieDomain(request)

    response.cookies.set(firebaseSessionCookieName, sessionCookie, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: firebaseSessionCookieMaxAgeSeconds,
      ...(cookieDomain ? { domain: cookieDomain } : {})
    })

    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create an admin session.'
    return expectsJson
      ? jsonResponse({ error: message, redirectTo: appHomeUrl.toString() }, 500)
      : NextResponse.redirect(appHomeUrl, 303)
  }
}
