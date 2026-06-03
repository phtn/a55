import {
  isAdminSubdomainPassthroughPath,
  getHostnameFromHostHeader,
  isAdminRoutePath,
  isAdminSubdomainHostname,
  supportsAdminSubdomain,
  toAdminExternalPath,
  toAdminInternalPath,
  toAdminSubdomainHostname
} from '@/lib/routing/admin-subdomain'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

/**
 * Next.js Proxy (formerly "middleware").
 *
 * This file uses the modern `proxy.ts` convention (see Next.js "middleware-to-proxy" migration).
 * It runs on the Edge runtime for matched routes and must remain extremely lightweight.
 *
 * We consulted the Vercel React/Next.js Best Practices skill when maintaining this file:
 * - Server-side request handlers should do the minimum work necessary.
 * - Expensive operations (auth verification, session cookie minting) belong in specific
 *   Route Handlers, not here.
 * - Hostname normalization and routing decisions are kept synchronous and fast.
 *
 * The matcher deliberately excludes `/api/*` because the admin-handoff and session APIs
 * perform their own hostname-aware logic (and the heavy Firebase work).
 */

export function proxy(request: NextRequest) {
  // Resolve + normalize the effective hostname **once** per request.
  // This code path is extremely hot (runs on almost every navigation when the matcher matches).
  // Per Vercel best practices for server/edge request handlers (see server-side perf rules),
  // we avoid repeated normalization and keep all work here minimal and synchronous.
  const hostname =
    getHostnameFromHostHeader(request.headers.get('x-forwarded-host') ?? request.headers.get('host')) ??
    request.nextUrl.hostname

  const { pathname } = request.nextUrl

  // Admin subdomain passthrough + rewrite/redirect rules.
  if (isAdminSubdomainHostname(hostname)) {
    if (isAdminSubdomainPassthroughPath(pathname)) {
      return NextResponse.next()
    }

    if (isAdminRoutePath(pathname)) {
      const canonicalAdminUrl = request.nextUrl.clone()
      canonicalAdminUrl.pathname = toAdminExternalPath(pathname)
      return NextResponse.redirect(canonicalAdminUrl)
    }

    const adminRouteUrl = request.nextUrl.clone()
    adminRouteUrl.pathname = toAdminInternalPath(pathname)
    return NextResponse.rewrite(adminRouteUrl)
  }

  if (supportsAdminSubdomain(hostname) && isAdminRoutePath(pathname)) {
    const adminSubdomainUrl = request.nextUrl.clone()
    adminSubdomainUrl.hostname = toAdminSubdomainHostname(hostname)
    adminSubdomainUrl.pathname = toAdminExternalPath(pathname)
    return NextResponse.redirect(adminSubdomainUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)']
}
