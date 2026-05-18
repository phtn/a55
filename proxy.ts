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

export function proxy(request: NextRequest) {
  const hostname =
    getHostnameFromHostHeader(request.headers.get('x-forwarded-host') ?? request.headers.get('host')) ??
    request.nextUrl.hostname
  const { pathname } = request.nextUrl

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
