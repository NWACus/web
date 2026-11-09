import { ROOT_DOMAIN } from '@/utilities/domain'
import { AVALANCHE_CENTERS, ValidTenantSlug } from '@/utilities/tenancy/avalancheCenters'
import type { ResolvedRange } from './analyticsRange'
import type { BreakdownPanel } from './panelTypes'

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
  range: ResolvedRange
}

/**
 * The per-center filter every panel shares. Admin pages are site management, not readership;
 * preview and development deployments register `center` too; bots are PostHog's own detection.
 */
export function centerFilter({ slug }: Pick<CenterQueryScope, 'slug'>): string {
  return [
    `(properties.center = ${literal(slug.toUpperCase())} OR properties.$host IN (${literalList(centerHosts(slug))}))`,
    `coalesce(properties.environment, '') NOT IN ('preview', 'development')`,
    `NOT startsWith(coalesce(properties.$pathname, ''), '/admin')`,
    `NOT coalesce(properties.$virt_is_bot, false)`,
  ].join('\n  AND ')
}

const currentPeriod = ({ range }: CenterQueryScope) =>
  `timestamp >= ${dateTime(range.start)} AND timestamp < ${dateTime(range.end)}`

const pageviewsInCurrentPeriod = (scope: CenterQueryScope) =>
  `event = '$pageview'
  AND ${currentPeriod(scope)}
  AND ${centerFilter(scope)}`

export type Period = 'current' | 'previous'

const periodWindow = ({ range }: CenterQueryScope, period: Period) =>
  period === 'current'
    ? `timestamp >= ${dateTime(range.start)} AND timestamp < ${dateTime(range.end)}`
    : `timestamp >= ${dateTime(range.previousStart)} AND timestamp < ${dateTime(range.start)}`

/** One period per query: a scan of both at once runs past PostHog's execution limit. */
export function overviewCountsQuery(scope: CenterQueryScope, period: Period): string {
  return `SELECT
  uniq(person_id) AS visitors,
  uniq($session_id) AS visits,
  count() AS pageviews
FROM events
WHERE event = '$pageview'
  AND ${periodWindow(scope, period)}
  AND ${centerFilter(scope)}`
}

/**
 * Bounce rate and visit duration come from PostHog's pre-aggregated sessions table, which answers
 * in about a second at any range. It carries no user agent, so bots cannot be excluded here.
 */
export function overviewVisitsQuery(scope: CenterQueryScope): string {
  const { range, slug } = scope
  const isCurrent = `$start_timestamp >= ${dateTime(range.start)}`
  return `SELECT
  avgIf($is_bounce, ${isCurrent}) AS bounce_rate,
  avgIf($is_bounce, NOT (${isCurrent})) AS previous_bounce_rate,
  avgIf($session_duration, ${isCurrent}) AS visit_duration,
  avgIf($session_duration, NOT (${isCurrent})) AS previous_visit_duration
FROM sessions
WHERE $start_timestamp >= ${dateTime(range.previousStart)}
  AND $start_timestamp < ${dateTime(range.end)}
  AND $entry_hostname IN (${literalList(centerHosts(slug))})
  AND NOT startsWith($entry_pathname, '/admin')`
}

export function timeseriesQuery(scope: CenterQueryScope): string {
  const local = `toTimeZone(timestamp, ${literal(scope.range.timezone)})`
  const bucket = scope.range.bucket === 'week' ? `toStartOfWeek(${local}, 1)` : `toDate(${local})`
  return `SELECT
  toString(${bucket}) AS date,
  uniq(person_id) AS visitors,
  uniq($session_id) AS visits,
  count() AS pageviews
FROM events
WHERE ${pageviewsInCurrentPeriod(scope)}
GROUP BY date
ORDER BY date`
}

type BreakdownSpec = {
  label: string
  secondary: 'visits' | 'pageviews'
  extraWhere?: (scope: CenterQueryScope) => string
}

const region = `if(
    coalesce(properties.$geoip_subdivision_1_name, '') != '',
    concat(properties.$geoip_subdivision_1_name, ', ', coalesce(properties.$geoip_country_code, '')),
    coalesce(nullIf(properties.$geoip_country_name, ''), 'Unknown')
  )`

const unknownIfEmpty = (expression: string) => `coalesce(nullIf(${expression}, ''), 'Unknown')`

const BREAKDOWNS: Record<BreakdownPanel, BreakdownSpec> = {
  pages: { label: `coalesce(properties.$pathname, '')`, secondary: 'pageviews' },
  entryPages: { label: unknownIfEmpty('session.$entry_pathname'), secondary: 'visits' },
  exitPages: { label: unknownIfEmpty('session.$end_pathname'), secondary: 'visits' },
  referrers: {
    label: unknownIfEmpty('properties.$referring_domain'),
    secondary: 'visits',
    extraWhere: ({ slug }) =>
      `coalesce(properties.$referring_domain, '') NOT IN (${literalList(centerHosts(slug))})`,
  },
  channels: { label: unknownIfEmpty('session.$channel_type'), secondary: 'visits' },
  countries: { label: unknownIfEmpty('properties.$geoip_country_name'), secondary: 'pageviews' },
  regions: { label: region, secondary: 'pageviews' },
  deviceTypes: { label: unknownIfEmpty('properties.$device_type'), secondary: 'pageviews' },
  browsers: { label: unknownIfEmpty('properties.$browser'), secondary: 'pageviews' },
  operatingSystems: { label: unknownIfEmpty('properties.$os'), secondary: 'pageviews' },
}

export function breakdownQuery(scope: CenterQueryScope, panel: BreakdownPanel): string {
  const spec = BREAKDOWNS[panel]
  const secondary = spec.secondary === 'visits' ? 'uniq($session_id)' : 'count()'
  const extra = spec.extraWhere ? `\n  AND ${spec.extraWhere(scope)}` : ''
  return `SELECT
  ${spec.label} AS label,
  uniq(person_id) AS visitors,
  ${secondary} AS secondary
FROM events
WHERE ${pageviewsInCurrentPeriod(scope)}${extra}
GROUP BY label
ORDER BY visitors DESC, secondary DESC
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
LIMIT 100`
}

/** `page_not_found` carries the requested path and the referrer, which is where the broken link lives. */
export function notFoundQuery(scope: CenterQueryScope): string {
  return `SELECT
  coalesce(properties.path, '') AS path,
  arrayElement(topK(1)(nullIf(properties.referrer, '')), 1) AS referrer,
  count() AS hits,
  uniq(person_id) AS people
FROM events
WHERE event = 'page_not_found'
  AND ${currentPeriod(scope)}
  AND ${centerFilter(scope)}
GROUP BY path
ORDER BY people DESC, hits DESC
LIMIT 10`
}

/**
 * Dropdowns and maps respond without changing the DOM, so PostHog records clicks on them as dead
 * even though they worked; left in, they would top every list. Merging by page and label happens
 * in TypeScript (see deadClicks.ts), so this returns more groups than the panel shows.
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
