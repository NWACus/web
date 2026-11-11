import { ROOT_DOMAIN } from '@/utilities/domain'
import { AVALANCHE_CENTERS, ValidTenantSlug } from '@/utilities/tenancy/avalancheCenters'
import type { ResolvedRange } from './analyticsRange'
import type { HogQLStatement } from './hogql'
import { LIST_ROW_CAP, type BreakdownReport } from './reportTypes'

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

export type CenterQueryScope = {
  slug: ValidTenantSlug
  range: ResolvedRange
}

// HogQL's toDateTime reads "YYYY-MM-DD HH:MM:SS" in the project timezone, which is UTC
const utcDateTime = (date: Date) => date.toISOString().slice(0, 19).replace('T', ' ')

/**
 * The values a center query may reference as `{center}`, `{hosts}`, `{timezone}`, `{start}`,
 * `{end}` and `{previousStart}`. PostHog substitutes and escapes them, so no request value is ever
 * spliced into SQL text.
 */
function scopeValues({ slug, range }: CenterQueryScope) {
  return {
    center: slug.toUpperCase(),
    hosts: centerHosts(slug),
    timezone: range.timezone,
    start: utcDateTime(range.start),
    end: utcDateTime(range.end),
    previousStart: utcDateTime(range.previousStart),
  }
}

const statement = (scope: CenterQueryScope, query: string): HogQLStatement => ({
  query,
  values: scopeValues(scope),
})

/**
 * The per-center filter every report shares. Admin pages are site management, not readership;
 * preview and development deployments register `center` too; bots are PostHog's own detection.
 */
export const CENTER_FILTER = [
  `(properties.center = {center} OR properties.$host IN {hosts})`,
  `coalesce(properties.environment, '') NOT IN ('preview', 'development')`,
  `NOT startsWith(coalesce(properties.$pathname, ''), '/admin')`,
  `NOT coalesce(properties.$virt_is_bot, false)`,
].join('\n  AND ')

const CURRENT_PERIOD = `timestamp >= toDateTime({start}) AND timestamp < toDateTime({end})`
const PREVIOUS_PERIOD = `timestamp >= toDateTime({previousStart}) AND timestamp < toDateTime({start})`

const PAGEVIEWS_IN_CURRENT_PERIOD = `event = '$pageview'
  AND ${CURRENT_PERIOD}
  AND ${CENTER_FILTER}`

export type Period = 'current' | 'previous'

/** One period per query: a scan of both at once runs past PostHog's execution limit. */
export function overviewCountsQuery(scope: CenterQueryScope, period: Period): HogQLStatement {
  return statement(
    scope,
    `SELECT
  uniq(person_id) AS visitors,
  uniq($session_id) AS visits,
  count() AS pageviews
FROM events
WHERE event = '$pageview'
  AND ${period === 'current' ? CURRENT_PERIOD : PREVIOUS_PERIOD}
  AND ${CENTER_FILTER}`,
  )
}

/**
 * Bounce rate and visit duration come from PostHog's pre-aggregated sessions table, which answers
 * in about a second at any range. It carries no user agent, so bots cannot be excluded here.
 */
export function overviewVisitsQuery(scope: CenterQueryScope): HogQLStatement {
  const isCurrent = `$start_timestamp >= toDateTime({start})`
  return statement(
    scope,
    `SELECT
  avgIf($is_bounce, ${isCurrent}) AS bounce_rate,
  avgIf($is_bounce, NOT (${isCurrent})) AS previous_bounce_rate,
  avgIf($session_duration, ${isCurrent}) AS visit_duration,
  avgIf($session_duration, NOT (${isCurrent})) AS previous_visit_duration
FROM sessions
WHERE $start_timestamp >= toDateTime({previousStart})
  AND $start_timestamp < toDateTime({end})
  AND $entry_hostname IN {hosts}
  AND NOT startsWith($entry_pathname, '/admin')`,
  )
}

export function timeseriesQuery(scope: CenterQueryScope): HogQLStatement {
  const local = `toTimeZone(timestamp, {timezone})`
  const bucket = {
    day: `toDate(${local})`,
    // Mode 1 starts weeks on Monday, matching fillTimeseries
    week: `toStartOfWeek(${local}, 1)`,
    month: `toStartOfMonth(${local})`,
  }[scope.range.bucket]
  return statement(
    scope,
    `SELECT
  toString(${bucket}) AS date,
  uniq(person_id) AS visitors,
  uniq($session_id) AS visits,
  count() AS pageviews
FROM events
WHERE ${PAGEVIEWS_IN_CURRENT_PERIOD}
GROUP BY date
ORDER BY date`,
  )
}

type BreakdownSpec = {
  /** HogQL for the row's label. */
  label: string
  extraWhere?: string
}

const region = `if(
    coalesce(properties.$geoip_subdivision_1_name, '') != '',
    concat(properties.$geoip_subdivision_1_name, ', ', coalesce(properties.$geoip_country_code, '')),
    coalesce(nullIf(properties.$geoip_country_name, ''), 'Unknown')
  )`

// "Seattle, WA, US"; IP lookups that resolve no city group as Unknown
const city = `if(
    coalesce(properties.$geoip_city_name, '') != '',
    concat(
      properties.$geoip_city_name,
      if(coalesce(properties.$geoip_subdivision_1_code, '') != '', concat(', ', properties.$geoip_subdivision_1_code), ''),
      if(coalesce(properties.$geoip_country_code, '') != '', concat(', ', properties.$geoip_country_code), '')
    ),
    'Unknown'
  )`

const unknownIfEmpty = (expression: string) => `coalesce(nullIf(${expression}, ''), 'Unknown')`

const BREAKDOWNS: Record<BreakdownReport, BreakdownSpec> = {
  pages: { label: `coalesce(properties.$pathname, '')` },
  entryPages: { label: unknownIfEmpty('session.$entry_pathname') },
  exitPages: { label: unknownIfEmpty('session.$end_pathname') },
  referrers: {
    label: unknownIfEmpty('properties.$referring_domain'),
    // A center's own hosts are internal navigation, not a source
    extraWhere: `coalesce(properties.$referring_domain, '') NOT IN {hosts}`,
  },
  channels: { label: unknownIfEmpty('session.$channel_type') },
  cities: { label: city },
  regions: { label: region },
  countries: { label: unknownIfEmpty('properties.$geoip_country_name') },
  deviceTypes: { label: unknownIfEmpty('properties.$device_type') },
  browsers: { label: unknownIfEmpty('properties.$browser') },
  operatingSystems: { label: unknownIfEmpty('properties.$os') },
}

/** Both visits and pageviews per row, so the page picks which to show without a second query. */
export function breakdownQuery(scope: CenterQueryScope, report: BreakdownReport): HogQLStatement {
  const spec = BREAKDOWNS[report]
  const extra = spec.extraWhere ? `\n  AND ${spec.extraWhere}` : ''
  return statement(
    scope,
    `SELECT
  ${spec.label} AS label,
  uniq(person_id) AS visitors,
  uniq($session_id) AS visits,
  count() AS pageviews
FROM events
WHERE ${PAGEVIEWS_IN_CURRENT_PERIOD}${extra}
GROUP BY label
ORDER BY visitors DESC, pageviews DESC
LIMIT ${LIST_ROW_CAP}`,
  )
}

export function sponsorsQuery(scope: CenterQueryScope): HogQLStatement {
  return statement(
    scope,
    `SELECT
  toString(properties.sponsor_id) AS sponsor_id,
  any(properties.sponsor_name) AS sponsor_name,
  countIf(event = 'sponsor_impression') AS impressions,
  countIf(event = 'sponsor_click') AS clicks
FROM events
WHERE event IN ('sponsor_impression', 'sponsor_click')
  AND ${CURRENT_PERIOD}
  AND ${CENTER_FILTER}
GROUP BY sponsor_id
ORDER BY impressions DESC, clicks DESC
LIMIT 100`,
  )
}

/** `page_not_found` carries the requested path and the referrer, which is where the broken link lives. */
export function notFoundQuery(scope: CenterQueryScope): HogQLStatement {
  return statement(
    scope,
    `SELECT
  coalesce(properties.path, '') AS path,
  arrayElement(topK(1)(nullIf(properties.referrer, '')), 1) AS referrer,
  count() AS hits,
  uniq(person_id) AS people
FROM events
WHERE event = 'page_not_found'
  AND ${CURRENT_PERIOD}
  AND ${CENTER_FILTER}
GROUP BY path
ORDER BY people DESC, hits DESC
LIMIT ${LIST_ROW_CAP}`,
  )
}

/**
 * Dropdowns and maps respond without changing the DOM, so PostHog records clicks on them as dead
 * even though they worked; left in, they would top every list. Merging by page and label happens
 * in TypeScript (see deadClicks.ts), so this returns more groups than the card shows.
 */
export function deadClicksQuery(scope: CenterQueryScope): HogQLStatement {
  return statement(
    scope,
    `SELECT
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
  AND ${CURRENT_PERIOD}
  AND ${CENTER_FILTER}
  AND NOT has(elements_chain_elements, 'select')
  AND NOT match(elements_chain, 'mapboxgl|maplibregl|leaflet')
GROUP BY path, tag, alt, aria_label, el_text, href
ORDER BY people DESC, clicks DESC
LIMIT 60`,
  )
}
