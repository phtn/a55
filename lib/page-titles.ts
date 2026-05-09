import type { Page } from '@/types/dashboard'

const ROUTE_TITLES: Record<Page | 'overview', string> = {
  overview: 'Overview',
  markets: 'Markets',
  explore: 'Explore',
  watchlist: 'Watchlist',
  bets: 'Bets'
}

export const getRoutePageTitle = (page: Page) => ROUTE_TITLES[page]

const formatSegment = (segment: string) =>
  segment
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

export const getPathnamePageTitle = (pathname: string) => {
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 0) {
    return ROUTE_TITLES.overview
  }

  if (segments[0] === 'company' && segments[1]) {
    return segments[1].toUpperCase()
  }

  const page = segments[0] as Page

  return ROUTE_TITLES[page] ?? formatSegment(segments[segments.length - 1])
}
