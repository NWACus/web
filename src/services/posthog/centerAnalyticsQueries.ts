import { ROOT_DOMAIN } from '@/utilities/domain'
import { AVALANCHE_CENTERS, ValidTenantSlug } from '@/utilities/tenancy/avalancheCenters'

export const ANALYTICS_WINDOW_DAYS = 30

export type AnalyticsWindow = {
  /** Start of the current period (inclusive, UTC). */
  start: Date
  /** Start of the comparison period (inclusive, UTC); it ends where `start` begins. */
  previousStart: Date
  /** End of the current period (exclusive). */
  end: Date
}

/**
 * Mirrors PostHog's "Last 30 days": from the start of the UTC day 30 days ago until now, compared
 * with the 30 days before that. The project timezone is UTC, so the boundaries line up.
 */
export function analyticsWindow(now: Date): AnalyticsWindow {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  start.setUTCDate(start.getUTCDate() - ANALYTICS_WINDOW_DAYS)
  const previousStart = new Date(start)
  previousStart.setUTCDate(previousStart.getUTCDate() - ANALYTICS_WINDOW_DAYS)
  return { start, previousStart, end: now }
}

/**
 * Hostnames a center's public site has been served from. Production pageviews before the `center`
 * super property shipped carry only `$host`, so queries match on either.
 */
export function centerHosts(slug: ValidTenantSlug): string[] {
  const customDomain = AVALANCHE_CENTERS[slug].customDomain
  // Strip a leading "www." so both the bare and www forms are matched
  const bareDomain = customDomain.replace(/^www\./, '')
  return Array.from(new Set([bareDomain, `www.${bareDomain}`, `${slug}.${ROOT_DOMAIN}`]))
}

// Double any single quote so a value can sit inside a HogQL string literal
const literal = (value: string) => `'${value.replace(/'/g, "''")}'`
const literalList = (values: string[]) => values.map(literal).join(', ')

// HogQL has no timezone-aware toDateTime, so format as "YYYY-MM-DD HH:MM:SS" in UTC
const dateTime = (date: Date) =>
  `toDateTime('${date.toISOString().slice(0, 19).replace('T', ' ')}')`

export type CenterQueryScope = {
  slug: ValidTenantSlug
  window: AnalyticsWindow
}

/**
 * The per-center filter every tile shares. Admin pages are site management, not readership.
 * Preview and development deployments register `center` too, so they are excluded by environment.
 */
export function centerFilter({ slug }: Pick<CenterQueryScope, 'slug'>): string {
  return [
    `(properties.center = ${literal(slug.toUpperCase())} OR properties.$host IN (${literalList(centerHosts(slug))}))`,
    `coalesce(properties.environment, '') NOT IN ('preview', 'development')`,
    `NOT startsWith(coalesce(properties.$pathname, ''), '/admin')`,
  ].join('\n  AND ')
}

const currentPeriod = ({ window }: CenterQueryScope) =>
  `timestamp >= ${dateTime(window.start)} AND timestamp < ${dateTime(window.end)}`

const pageviewsInCurrentPeriod = (scope: CenterQueryScope) =>
  `event = '$pageview'
  AND ${currentPeriod(scope)}
  AND ${centerFilter(scope)}`

export function overviewQuery(scope: CenterQueryScope): string {
  const { window } = scope
  const inCurrent = `timestamp >= ${dateTime(window.start)}`
  return `SELECT
  uniqIf(person_id, ${inCurrent}) AS visitors,
  uniqIf(person_id, NOT (${inCurrent})) AS previous_visitors,
  uniqIf($session_id, ${inCurrent}) AS sessions,
  uniqIf($session_id, NOT (${inCurrent})) AS previous_sessions,
  countIf(${inCurrent}) AS pageviews,
  countIf(NOT (${inCurrent})) AS previous_pageviews
FROM events
WHERE event = '$pageview'
  AND timestamp >= ${dateTime(window.previousStart)} AND timestamp < ${dateTime(window.end)}
  AND ${centerFilter(scope)}`
}

export function topPagesQuery(scope: CenterQueryScope): string {
  return `SELECT
  coalesce(properties.$pathname, '') AS path,
  count() AS pageviews,
  uniq(person_id) AS visitors
FROM events
WHERE ${pageviewsInCurrentPeriod(scope)}
GROUP BY path
ORDER BY pageviews DESC, visitors DESC
LIMIT 10`
}

export function topReferrersQuery(scope: CenterQueryScope): string {
  return `SELECT
  coalesce(nullIf(properties.$referring_domain, ''), 'Unknown') AS referrer,
  uniq(person_id) AS visitors,
  uniq($session_id) AS sessions
FROM events
WHERE ${pageviewsInCurrentPeriod(scope)}
  AND coalesce(properties.$referring_domain, '') NOT IN (${literalList(centerHosts(scope.slug))})
GROUP BY referrer
ORDER BY visitors DESC, sessions DESC
LIMIT 10`
}

export function devicesQuery(scope: CenterQueryScope): string {
  return `SELECT
  coalesce(nullIf(properties.$device_type, ''), 'Unknown') AS device,
  uniq(person_id) AS visitors,
  count() AS pageviews
FROM events
WHERE ${pageviewsInCurrentPeriod(scope)}
GROUP BY device
ORDER BY visitors DESC`
}

export function topRegionsQuery(scope: CenterQueryScope): string {
  return `SELECT
  if(
    coalesce(properties.$geoip_subdivision_1_name, '') != '',
    concat(properties.$geoip_subdivision_1_name, ', ', coalesce(properties.$geoip_country_code, '')),
    coalesce(nullIf(properties.$geoip_country_name, ''), 'Unknown')
  ) AS region,
  uniq(person_id) AS visitors,
  count() AS pageviews
FROM events
WHERE ${pageviewsInCurrentPeriod(scope)}
GROUP BY region
ORDER BY visitors DESC, pageviews DESC
LIMIT 10`
}

export function sponsorsQuery(scope: CenterQueryScope): string {
  return `SELECT
  toString(properties.sponsor_id) AS sponsor_id,
  any(properties.sponsor_name) AS sponsor_name,
  countIf(event = 'sponsor_impression') AS impressions,
  countIf(event = 'sponsor_click') AS clicks
FROM events
WHERE event IN ('sponsor_impression', 'sponsor_click')
  AND ${currentPeriod(scope)}
  AND ${centerFilter(scope)}
GROUP BY sponsor_id
ORDER BY impressions DESC, clicks DESC
LIMIT 50`
}

/**
 * Dropdowns and maps respond without changing the DOM, so PostHog records clicks on them as dead
 * even though they worked; left in, they would top every list. Merging by page and label happens
 * in TypeScript (see deadClicks.ts), so this returns more groups than the tile shows.
 */
export function deadClicksQuery(scope: CenterQueryScope): string {
  return `SELECT
  coalesce(properties.$pathname, '') AS path,
  extract(elements_chain, '^([a-z0-9]+)') AS tag,
  extract(elements_chain, 'attr__alt="([^"]+)"') AS alt,
  extract(elements_chain, 'attr__aria-label="([^"]+)"') AS aria_label,
  properties.$el_text AS el_text,
  elements_chain_href AS href,
  count() AS clicks,
  uniq(person_id) AS people
FROM events
WHERE event = '$dead_click'
  AND ${currentPeriod(scope)}
  AND ${centerFilter(scope)}
  AND NOT has(elements_chain_elements, 'select')
  AND NOT match(elements_chain, 'mapboxgl|maplibregl|leaflet')
GROUP BY path, tag, alt, aria_label, el_text, href
ORDER BY people DESC, clicks DESC
LIMIT 60`
}
