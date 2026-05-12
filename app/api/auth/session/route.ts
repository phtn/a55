import { getFirebaseAdminAuth } from '@/lib/firebase/admin'
import {
  firebaseSessionCookieMaxAgeMs,
  firebaseSessionCookieMaxAgeSeconds,
  firebaseSessionCookieName
} from '@/lib/firebase/session'
import { NextResponse, type NextRequest } from 'next/server'

export const runtime = 'nodejs'

type SessionBody = {
  idToken?: unknown
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
  try {
    const auth = getFirebaseAdminAuth()

    if (!auth) {
      return jsonResponse({ error: 'Firebase Admin credentials are not configured.' }, 500)
    }

    const body = (await request.json().catch(() => null)) as SessionBody | null
    const idToken = body?.idToken

    if (typeof idToken !== 'string' || idToken.trim().length === 0) {
      return jsonResponse({ error: 'Missing Firebase ID token.' }, 400)
    }

    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: firebaseSessionCookieMaxAgeMs
    })

    const response = jsonResponse({ ok: true })
    response.cookies.set(firebaseSessionCookieName, sessionCookie, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: firebaseSessionCookieMaxAgeSeconds
    })
    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create a Firebase session.'
    return jsonResponse({ error: message }, 500)
  }
}

export async function DELETE() {
  const response = jsonResponse({ ok: true })

  response.cookies.set(firebaseSessionCookieName, '', {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0
  })

  return response
}
