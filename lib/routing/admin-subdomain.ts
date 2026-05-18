export const adminRoutePrefix = '/admin'
export const adminSubdomainLabel = 'admin'
export const adminSubdomainHandoffPath = '/admin-handoff'

function normalizeHostname(hostname: string) {
  return hostname.trim().toLowerCase().replace(/\.$/, '')
}

export function getHostnameFromHostHeader(hostHeader: string | null | undefined) {
  if (!hostHeader) {
    return null
  }

  const firstHost = hostHeader.split(',')[0]?.trim()

  if (!firstHost) {
    return null
  }

  try {
    return normalizeHostname(new URL(`http://${firstHost}`).hostname)
  } catch {
    return normalizeHostname(firstHost.replace(/:\d+$/, ''))
  }
}

function isIpv4Address(hostname: string) {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)
}

function isIpv6Address(hostname: string) {
  return hostname.includes(':')
}

export function isIpHostname(hostname: string) {
  const normalizedHostname = normalizeHostname(hostname)
  return isIpv4Address(normalizedHostname) || isIpv6Address(normalizedHostname)
}

export function isAdminSubdomainHostname(hostname: string) {
  return normalizeHostname(hostname).startsWith(`${adminSubdomainLabel}.`)
}

export function stripAdminSubdomain(hostname: string) {
  const normalizedHostname = normalizeHostname(hostname)

  if (!isAdminSubdomainHostname(normalizedHostname)) {
    return normalizedHostname
  }

  return normalizedHostname.slice(adminSubdomainLabel.length + 1)
}

export function supportsAdminSubdomain(hostname: string) {
  const normalizedHostname = normalizeHostname(hostname)
  return normalizedHostname.length > 0 && !isIpHostname(normalizedHostname)
}

export function toAdminSubdomainHostname(hostname: string) {
  const normalizedHostname = normalizeHostname(hostname)

  if (!supportsAdminSubdomain(normalizedHostname) || isAdminSubdomainHostname(normalizedHostname)) {
    return normalizedHostname
  }

  return `${adminSubdomainLabel}.${normalizedHostname}`
}

export function toAdminExternalPath(pathname: string) {
  if (pathname === adminRoutePrefix) {
    return '/'
  }

  if (pathname.startsWith(`${adminRoutePrefix}/`)) {
    return pathname.slice(adminRoutePrefix.length)
  }

  return pathname
}

export function toAdminInternalPath(pathname: string) {
  if (pathname === '/' || pathname.length === 0) {
    return adminRoutePrefix
  }

  if (pathname === adminRoutePrefix || pathname.startsWith(`${adminRoutePrefix}/`)) {
    return pathname
  }

  return `${adminRoutePrefix}${pathname}`
}

export function isAdminRoutePath(pathname: string) {
  return pathname === adminRoutePrefix || pathname.startsWith(`${adminRoutePrefix}/`)
}

export function isAdminSubdomainPassthroughPath(pathname: string) {
  return pathname === adminSubdomainHandoffPath || pathname.startsWith(`${adminSubdomainHandoffPath}/`)
}

export function getSharedCookieDomain(hostname: string) {
  const appHostname = stripAdminSubdomain(hostname)

  if (appHostname === 'localhost') {
    return undefined
  }

  if (!supportsAdminSubdomain(appHostname)) {
    return undefined
  }

  return appHostname
}
