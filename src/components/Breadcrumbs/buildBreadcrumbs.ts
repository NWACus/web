export type BreadcrumbItemData = {
  name: string
  href: string | null
  isLast: boolean
  /** True when the name came from the URL segment rather than an explicit title or label. */
  isDerived: boolean
}

export type BuildBreadcrumbsArgs = {
  center: string
  /** URL path within the center, without the center prefix, e.g. `/blog/some-post`. */
  path: string
  /** Explicit label for the leaf crumb. Wins over a matching `labels` entry. */
  title?: string
  /** Explicit labels for any crumb, keyed by the crumb's cumulative path. */
  labels?: Record<string, string>
}

// First path segments that are served by native Next.js routes rather than the CMS
// page catch-all. Intermediate crumbs under any other root are navigation groupings
// with no page of their own, so they never link.
const NATIVE_ROUTE_ROOTS = ['blog', 'events', 'forecasts', 'observations', 'weather']

const KNOWN_PATHS_WITHOUT_PAGES = ['/forecasts', '/weather', '/observations/avalanches']

// Only NWAC has a /weather/stations index page, so only its crumb links.
const STATIONS_INDEX_CENTER = 'nwac'

export function buildBreadcrumbs({
  center,
  path,
  title,
  labels = {},
}: BuildBreadcrumbsArgs): BreadcrumbItemData[] {
  const segments = path
    .split('/')
    .filter((segment) => segment !== '')
    .map(decodeURIComponent)

  if (segments.length === 0) return []

  const pathsWithoutPages = [...KNOWN_PATHS_WITHOUT_PAGES]
  if (center !== STATIONS_INDEX_CENTER) pathsWithoutPages.push('/weather/stations')

  const isCmsPath = !NATIVE_ROUTE_ROOTS.includes(segments[0])

  return segments.map((segment, index) => {
    const isLast = index === segments.length - 1
    const cumulativePath = '/' + segments.slice(0, index + 1).join('/')
    const isLinkable = !isLast && !isCmsPath && !pathsWithoutPages.includes(cumulativePath)

    const explicitName = (isLast && title) || labels[cumulativePath]

    return {
      // Derived names come from URL slugs, so dashes read as spaces.
      name: explicitName ?? segment.replace(/-/g, ' '),
      href: isLinkable ? cumulativePath : null,
      isLast,
      isDerived: explicitName === undefined,
    }
  })
}
