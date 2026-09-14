/**
 * Pure logic behind the forecast archive browser: the season model, how a URL query resolves to a
 * filter set, and how a center's trimmed product archive becomes the filtered, counted, paginated
 * rows the page renders. Kept free of network and React so every branch is unit-testable; the
 * route fetches, and the components only render.
 *
 * Reproduces the legacy afp archive browser (`views/Archive.vue`) on top of the same date model
 * the date picker uses: a row's date is its *valid date* (`validDateForProduct`, noon cutover in
 * the center's timezone), so each row links to a dated forecast URL that resolves to it.
 */
import { TZDate } from '@date-fns/tz'
import { format } from 'date-fns/format'
import { parseISO } from 'date-fns/parseISO'

import { validDateForProduct, type ArchiveProductSummary } from './archiveDates'

/** The browser's tenant-relative path. */
export const ARCHIVE_PATH = '/forecasts/avalanche/archive'

/** Rows per page, matching the legacy browser. */
export const ARCHIVE_PAGE_SIZE = 50

/**
 * The first season offered when the center's metadata carries no `widget_config.forecast.start_year`,
 * matching the legacy widget's fallback.
 */
export const DEFAULT_ARCHIVE_START_SEASON = 2020

/** The product types the browser lists, in the legacy widget's order. */
export const ARCHIVE_PRODUCT_TYPES = ['summary', 'forecast'] as const
export type ArchiveProductType = (typeof ARCHIVE_PRODUCT_TYPES)[number]

/** Danger levels 0–5 as the browser filters and counts them (below zero is folded into 0). */
export const ARCHIVE_DANGER_LEVELS = [0, 1, 2, 3, 4, 5] as const

// Matches a YYYY-MM-DD date.
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/** Today's calendar date in the center's timezone as `yyyy-MM-dd`. */
export function todayInTimezone(timezone: string | null | undefined, now = new Date()): string {
  const date = timezone ? new TZDate(now.getTime(), timezone) : now
  return format(date, 'yyyy-MM-dd')
}

/**
 * A season is named by the year it ends in: 2025-09-01 through 2026-08-31 is season 2026. The
 * legacy widget's `currentSeason` applies the same rule to today.
 */
export function seasonOfDate(date: string): number {
  const year = Number(date.slice(0, 4))
  const month = Number(date.slice(5, 7))
  return month >= 9 ? year + 1 : year
}

/** The inclusive `yyyy-MM-dd` window a season spans. */
export function seasonWindow(season: number): { from: string; to: string } {
  return { from: `${season - 1}-09-01`, to: `${season}-08-31` }
}

/** "Current Season" for the season in progress, "2024-2025 Season" for any other. */
export function seasonLabel(season: number, currentSeason: number): string {
  return season === currentSeason ? 'Current Season' : `${season - 1}-${season} Season`
}

/** The seasons on offer, newest first, from the current one back to the center's start season. */
export function seasonOptions(
  currentSeason: number,
  startSeason: number,
): { value: number; label: string }[] {
  const options: { value: number; label: string }[] = []
  for (let season = currentSeason; season >= Math.min(startSeason, currentSeason); season -= 1) {
    options.push({ value: season, label: seasonLabel(season, currentSeason) })
  }
  return options
}

/** The query as the URL carries it, after parsing. Every field may be absent or nonsense. */
export interface ArchiveQuery {
  season: number | null
  from: string | null
  to: string | null
  zone: string[]
  danger: number[]
  type: string[]
  page: number
}

/** The resolved filter set the page renders: every field valid, defaulted and in range. */
export interface ArchiveFilters {
  season: number
  currentSeason: number
  /** The inclusive date window fetched upstream: the whole season. */
  window: { from: string; to: string }
  /** The inclusive date range shown, within the window. */
  from: string
  to: string
  /** The range the season falls back to when the URL carries none: its start through today. */
  defaultRange: { from: string; to: string }
  /** Whether the shown range differs from the default, so it can be reset on its own. */
  isDateFiltered: boolean
  /** Selected zone slugs; empty means all. */
  zone: string[]
  /** Selected danger levels 0–5; empty means all. */
  danger: number[]
  /** Selected product types; empty means all. */
  type: ArchiveProductType[]
  page: number
  /** Whether anything differs from the defaults, for the "Clear filters" affordance. */
  isFiltered: boolean
}

function isArchiveProductType(value: string): value is ArchiveProductType {
  return ARCHIVE_PRODUCT_TYPES.some((type) => type === value)
}

function isDangerLevel(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 5
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values))
}

function dateWithin(value: string | null, from: string, to: string): value is string {
  return value !== null && DATE_PATTERN.test(value) && value >= from && value <= to
}

/**
 * Resolve a parsed URL query to the filters the page renders. Anything missing, malformed, out of
 * range or unknown falls back to the default — the legacy browser's starting state: the current
 * season from its first day through today, every zone, danger and product type, page one.
 *
 * `today` is the center's local date, so the season boundary and the default end date follow the
 * center's clock, not the server's. `zoneSlugs` is the center's active zone list, so a stale or
 * mistyped zone in a shared URL cannot filter the list down to nothing.
 */
export function resolveArchiveFilters(
  query: ArchiveQuery,
  options: { today: string; startSeason: number; zoneSlugs: string[] },
): ArchiveFilters {
  const currentSeason = seasonOfDate(options.today)
  const startSeason = Math.min(options.startSeason, currentSeason)

  const season =
    query.season !== null &&
    Number.isInteger(query.season) &&
    query.season >= startSeason &&
    query.season <= currentSeason
      ? query.season
      : currentSeason

  const window = seasonWindow(season)
  // The current season runs up to today; a past season is shown whole.
  const defaultRange = {
    from: window.from,
    to: season === currentSeason ? options.today : window.to,
  }

  let from = dateWithin(query.from, window.from, window.to) ? query.from : defaultRange.from
  let to = dateWithin(query.to, window.from, window.to) ? query.to : defaultRange.to
  if (from > to) {
    from = defaultRange.from
    to = defaultRange.to
  }
  const isDateFiltered = from !== defaultRange.from || to !== defaultRange.to

  const known = new Set(options.zoneSlugs)
  const zone = unique(query.zone.filter((slug) => known.has(slug)))
  const danger = unique(query.danger.filter(isDangerLevel)).sort((a, b) => a - b)
  const type = unique(query.type.filter(isArchiveProductType))
  const page = Number.isInteger(query.page) && query.page >= 1 ? query.page : 1

  const isFiltered =
    season !== currentSeason ||
    isDateFiltered ||
    zone.length > 0 ||
    danger.length > 0 ||
    type.length > 0

  return {
    season,
    currentSeason,
    window,
    from,
    to,
    defaultRange,
    isDateFiltered,
    zone,
    danger,
    type,
    page,
    isFiltered,
  }
}

/** The zone facts a row carries, resolved from the center's active zone list. */
export interface ArchiveZone {
  id: number
  slug: string
  name: string
}

export interface ArchiveRow {
  productId: number
  /** Valid date as `yyyy-MM-dd` (center timezone, noon cutover) — the dated route's segment. */
  date: string
  zoneId: number
  zoneSlug: string
  zoneName: string
  productType: ArchiveProductType
  /** Danger level 0–5; general-information products (-1) fold into 0, as in the legacy browser. */
  dangerLevel: number
  author: string | null
  publishedTime: string
}

/** Fold the raw `danger_rating` (-1..5) into the 0–5 scale the browser filters and counts on. */
export function archiveDangerLevel(rating: number): number {
  return isDangerLevel(rating) ? rating : 0
}

/**
 * The browser's rows for a center's archive: one row per product per zone it covers, so a
 * center-wide summary appears under every zone, exactly as the legacy browser expands it.
 *
 * Two rules from the legacy browser are kept: only forecast and summary products are listed
 * (synopsis posts and weather are other tabs), and a product with a null `updated_at` is hidden —
 * that marks the ~1,200 NWAC forecasts bulk-imported from the pre-AFP system, which carry no
 * author or danger text.
 *
 * One rule is deliberately different. A zone-day with more than one product (a re-issue later the
 * same day) is collapsed to its latest publication, because each row links to the dated forecast
 * URL and that URL resolves a zone-day to its latest product (`buildZoneArchiveDates` applies the
 * same rule for the date picker). The legacy browser listed every product because it linked by
 * id; here a second row would link to the same page as the first. Roughly 3% of NWAC's rows.
 *
 * Rows come back newest first, and within a day in the center's zone order.
 */
export function buildArchiveRows(
  items: ArchiveProductSummary[],
  zones: ArchiveZone[],
  timezone: string | null | undefined,
): ArchiveRow[] {
  const zoneById = new Map(zones.map((zone, order) => [zone.id, { zone, order }]))
  const latest = new Map<string, { row: ArchiveRow; order: number }>()

  for (const item of items) {
    const listed = listedProduct(item, timezone)
    if (!listed) continue

    for (const covered of item.forecast_zone) {
      const known = zoneById.get(covered.id)
      if (known) keepLatest(latest, known.order, archiveRow(item, listed, known.zone))
    }
  }

  return Array.from(latest.values())
    .sort((a, b) => b.row.date.localeCompare(a.row.date) || a.order - b.order)
    .map((entry) => entry.row)
}

/** The product's listed type and valid date, or `null` when the browser does not list it. */
function listedProduct(
  item: ArchiveProductSummary,
  timezone: string | null | undefined,
): { productType: ArchiveProductType; date: string } | null {
  if (!isArchiveProductType(item.product_type) || item.updated_at === null) return null

  const date = validDateForProduct(item.published_time, timezone)
  return date ? { productType: item.product_type, date } : null
}

function archiveRow(
  item: ArchiveProductSummary,
  listed: { productType: ArchiveProductType; date: string },
  zone: ArchiveZone,
): ArchiveRow {
  return {
    productId: item.id,
    date: listed.date,
    zoneId: zone.id,
    zoneSlug: zone.slug,
    zoneName: zone.name,
    productType: listed.productType,
    dangerLevel: archiveDangerLevel(item.danger_rating),
    author: item.author,
    publishedTime: item.published_time,
  }
}

/** Keep the zone-day's latest publication. ISO-8601 timestamps compare correctly as strings. */
function keepLatest(
  latest: Map<string, { row: ArchiveRow; order: number }>,
  order: number,
  row: ArchiveRow,
) {
  const key = `${row.zoneId}|${row.date}`
  const existing = latest.get(key)
  if (existing && existing.row.publishedTime >= row.publishedTime) return
  latest.set(key, { row, order })
}

/** The rows matching a resolved filter set: within the date range, and in every selected set. */
export function applyArchiveFilters(rows: ArchiveRow[], filters: ArchiveFilters): ArchiveRow[] {
  const zones = new Set(filters.zone)
  const dangers = new Set(filters.danger)
  const types = new Set<string>(filters.type)

  return rows.filter(
    (row) =>
      row.date >= filters.from &&
      row.date <= filters.to &&
      (zones.size === 0 || zones.has(row.zoneSlug)) &&
      (dangers.size === 0 || dangers.has(row.dangerLevel)) &&
      (types.size === 0 || types.has(row.productType)),
  )
}

/** How many rows sit at each danger level 0–5, for the summary bar over the filtered list. */
export function dangerCounts(rows: ArchiveRow[]): number[] {
  const counts = ARCHIVE_DANGER_LEVELS.map(() => 0)
  for (const row of rows) counts[row.dangerLevel] += 1
  return counts
}

export interface ArchivePage {
  rows: ArchiveRow[]
  /** The page actually shown — the requested one clamped into range. */
  page: number
  pageCount: number
  total: number
}

/** One page of rows. A page beyond the end shows the last page rather than an empty one. */
export function paginateArchiveRows(
  rows: ArchiveRow[],
  requestedPage: number,
  pageSize = ARCHIVE_PAGE_SIZE,
): ArchivePage {
  const total = rows.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(1, requestedPage), pageCount)
  const start = (page - 1) * pageSize

  return { rows: rows.slice(start, start + pageSize), page, pageCount, total }
}

/** Where a row links: the dated forecast view for its zone and valid date. */
export function archiveRowHref(row: Pick<ArchiveRow, 'zoneSlug' | 'date'>): string {
  return `/forecasts/avalanche/${row.zoneSlug}/${row.date}`
}

/** The legacy browser's names for the two listed product types. */
export function archiveProductTypeLabel(type: ArchiveProductType): string {
  return type === 'summary' ? 'General Avalanche Information' : 'Avalanche Forecast'
}

/** A `yyyy-MM-dd` date as the browser prints it ("Apr 5, 2026"). */
export function formatArchiveDate(date: string): string {
  return format(parseISO(date), 'MMM d, yyyy')
}
