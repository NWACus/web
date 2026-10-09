/**
 * Pure logic for turning a center's product archive into a single zone's list of
 * browsable forecast dates. Kept free of network/IO so it is unit-testable.
 *
 * Date model: a product's *valid date* is the calendar day the product applies to,
 * in the center's timezone, using the legacy "noon cutover" rule — products
 * published at or after 12:00 local are treated as the next day's product (NWAC
 * publishes the evening before). This matches the date the legacy widget displays
 * and highlights, so shareable dated URLs line up with what readers expect.
 */
import { TZDate } from '@date-fns/tz'
import { addDays } from 'date-fns/addDays'
import { endOfMonth } from 'date-fns/endOfMonth'
import { format } from 'date-fns/format'
import { isValid } from 'date-fns/isValid'
import { parseISO } from 'date-fns/parseISO'
import { startOfMonth } from 'date-fns/startOfMonth'
import { subMonths } from 'date-fns/subMonths'

/** Product types that the native forecast view can render (others, e.g. synopsis, are skipped). */
const RENDERABLE_PRODUCT_TYPES = new Set(['forecast', 'summary'])

/**
 * The minimal slice of an archive product this module and the archive browser need. The full
 * archive is ~10MB for NWAC — too large for Next's 2MB data cache — so callers cache only these
 * fields (~2MB for the whole NWAC archive; every caller narrows by date window, so no cache
 * entry actually holds all of it).
 */
export interface ArchiveProductSummary {
  id: number
  product_type: string
  published_time: string
  /** Overall danger rating (0-5; -1 = general info). Used to color the picker. */
  danger_rating: number
  /** The overall rating in words ("moderate"), for the picker's day preview. */
  danger_level_text: string | null
  /** The current day's per-elevation danger, for the picker's day preview. */
  current_danger: ElevationDanger | null
  /** Forecaster name, for the archive browser's rows. Null on bulk-imported history. */
  author: string | null
  /** When the product stops being valid, for finding the product that covers a later day. */
  expires_time: string | null
  /**
   * Null on stub forecasts (NWAC 2019–2020, SAC 2019–2021: date, zone and overall rating only),
   * which every legacy view hides (`updated_at != null`). Present only to apply the same rule.
   */
  updated_at: string | null
  forecast_zone: { id: number }[]
}

/** One day's danger by elevation band (-1..5), null where the product leaves a band unrated. */
export interface ElevationDanger {
  upper: number | null
  middle: number | null
  lower: number | null
}

/**
 * The `current` entry of a list product's `danger` — the day the product is valid for, which the
 * picker previews. Null when the product carries none.
 */
export function currentElevationDanger(
  danger:
    | {
        upper?: number | null
        middle?: number | null
        lower?: number | null
        valid_day?: string | null
      }[]
    | null
    | undefined,
): ElevationDanger | null {
  const current = danger?.find((entry) => entry.valid_day === 'current')
  if (!current) return null

  return {
    upper: current.upper ?? null,
    middle: current.middle ?? null,
    lower: current.lower ?? null,
  }
}

export interface ZoneArchiveDate {
  /** Valid date as `YYYY-MM-DD` (center timezone, noon-cutover applied). */
  date: string
  /** The product id to fetch for this date. */
  productId: number
  /** Product type, so the picker can mark non-daily products (e.g. summary). */
  productType: string
  /** Overall danger rating (0-5; -1 = general info) for coloring the calendar day. */
  dangerRating: number
  /** The overall rating in words, shown when the reader hovers or focuses the day. */
  dangerLevelText: string | null
  /** The day's danger by elevation, drawn as the preview's triangle. */
  danger: ElevationDanger | null
  /** When the product stops being valid (ISO-8601), or null when unknown. */
  expiresTime: string | null
}

/**
 * The calendar day a product applies to, in the center's timezone, as `YYYY-MM-DD`.
 * Returns null for an unparseable timestamp.
 */
export function validDateForProduct(
  publishedTime: string,
  timezone: string | null | undefined,
): string | null {
  const date = timezone ? new TZDate(publishedTime, timezone) : new Date(publishedTime)
  if (isNaN(date.getTime())) return null
  // Published at/after local noon → the product is for the following day.
  const valid = date.getHours() >= 12 ? addDays(date, 1) : date
  return format(valid, 'yyyy-MM-dd')
}

/**
 * The calendar day a product was published on, in the center's timezone, as `YYYY-MM-DD` — with no
 * noon cutover, for products dated by the day they were issued rather than the day they apply to.
 * Returns null for an unparseable timestamp.
 */
export function publishedDateForProduct(
  publishedTime: string,
  timezone: string | null | undefined,
): string | null {
  const instant = new Date(publishedTime)
  if (Number.isNaN(instant.getTime())) return null

  const local = timezone ? new TZDate(instant.getTime(), timezone) : instant
  return format(local, 'yyyy-MM-dd')
}

/**
 * A product's valid date formatted as a day heading (e.g. "Tuesday, April 14, 2026"), in the
 * center's timezone with the noon-cutover rule, offset by `offsetDays` (1 = the next/outlook day).
 * Returns null for an unparseable timestamp. Parses the already-resolved `yyyy-MM-dd` valid date
 * as a plain calendar day so the heading never shifts across a timezone boundary.
 */
export function validDateHeading(
  publishedTime: string,
  timezone: string | null | undefined,
  offsetDays = 0,
): string | null {
  const valid = validDateForProduct(publishedTime, timezone)
  if (!valid) return null
  return format(addDays(parseISO(valid), offsetDays), 'EEEE, MMMM d, yyyy')
}

/**
 * Build the ordered (newest-first) list of browsable dates for a single zone from the
 * full center archive. Filters to renderable products that cover the zone, collapses
 * each valid date to its most-recently-published product (corrections/re-issues land on
 * the same date), and sorts newest-first.
 *
 * Null-`updated_at` stubs are skipped, so they neither appear in the picker nor resolve a
 * dated URL — the legacy widget's picker and forecast view both hide them too.
 */
export function buildZoneArchiveDates(
  items: ArchiveProductSummary[],
  zoneId: number,
  timezone: string | null | undefined,
): ZoneArchiveDate[] {
  const byDate = new Map<string, ArchiveProductSummary>()

  for (const item of items) {
    if (!RENDERABLE_PRODUCT_TYPES.has(item.product_type) || item.updated_at === null) continue
    if (!item.forecast_zone.some((zone) => zone.id === zoneId)) continue

    const date = validDateForProduct(item.published_time, timezone)
    if (!date) continue

    const existing = byDate.get(date)
    // ISO-8601 timestamps compare correctly as strings; keep the latest publication.
    if (!existing || item.published_time > existing.published_time) byDate.set(date, item)
  }

  return Array.from(byDate.entries())
    .map(([date, item]) => ({
      date,
      productId: item.id,
      productType: item.product_type,
      dangerRating: item.danger_rating,
      dangerLevelText: item.danger_level_text,
      danger: item.current_danger,
      expiresTime: item.expires_time,
    }))
    .sort((a, b) => b.date.localeCompare(a.date))
}

/** Resolve a `YYYY-MM-DD` date to its product id within a prebuilt zone date list. */
export function findProductIdForDate(archiveDates: ZoneArchiveDate[], date: string): number | null {
  return archiveDates.find((entry) => entry.date === date)?.productId ?? null
}

/** The first instant of a `YYYY-MM-DD` day in the center's timezone. */
function startOfValidDay(date: string, timezone: string | null | undefined): Date {
  const [year, month, day] = date.split('-').map(Number)
  return timezone ? new TZDate(year, month - 1, day, timezone) : new Date(year, month - 1, day)
}

/**
 * The dated address that shows `date`: its own when it has a product, otherwise the latest earlier
 * product still valid when that day began (a multi-day summary, say), so the address doesn't 404
 * on a day the product covers. Null when nothing covers it. `archiveDates` is newest first, as
 * `buildZoneArchiveDates` returns it; an unparseable expiry covers nothing.
 */
export function findCoveringProductDate(
  archiveDates: ZoneArchiveDate[],
  date: string,
  timezone: string | null | undefined,
): string | null {
  if (archiveDates.some((entry) => entry.date === date)) return date

  const dayStart = startOfValidDay(date, timezone).getTime()
  const covering = archiveDates.find(
    (entry) =>
      entry.date < date && entry.expiresTime !== null && Date.parse(entry.expiresTime) > dayStart,
  )
  return covering?.date ?? null
}

/**
 * The date window (`date_start`/`date_end`) the page renders up front for the picker: the
 * anchor's month plus the prior month, so the calendar opens populated and one page-back is
 * instant. Older months are lazy-loaded client-side. Anchor is the shown date, or today.
 */
export function initialArchiveWindow(anchor: string | null): { from: string; to: string } {
  const date = anchor ? parseISO(anchor) : new Date()
  return {
    from: format(startOfMonth(subMonths(date, 1)), 'yyyy-MM-dd'),
    to: format(endOfMonth(date), 'yyyy-MM-dd'),
  }
}

/** The season the legacy widget's calendar opens on when a center sets no `start_year`. */
const DEFAULT_CALENDAR_START_YEAR = 2019

/**
 * The first day the date picker offers, as `YYYY-MM-DD`: September 1 of the year before the
 * center's `start_year` (a season's ending year), or September 1, 2019 when that is unset.
 * Returned as a plain calendar day so the client builds it as a *local* date — the widget's
 * `new Date('YYYY-09-01')` parses as UTC midnight, which is still August 31 in US timezones.
 */
export function forecastCalendarStart(startYear: number | undefined): string {
  const year = startYear ? startYear - 1 : DEFAULT_CALENDAR_START_YEAR
  return `${year}-09-01`
}

/** What the forecast date picker needs from the center's own configuration. */
export interface ForecastPickerSettings {
  /** First day the calendar offers, `YYYY-MM-DD` (see `forecastCalendarStart`). */
  calendarStart: string
  /** The widget names the zone in the dropdown only when the center has more than one. */
  showZoneName: boolean
}

export function forecastPickerSettings(center: {
  widget_config: { forecast?: { start_year?: number } }
  zones: { status: string }[]
}): ForecastPickerSettings {
  return {
    calendarStart: forecastCalendarStart(center.widget_config.forecast?.start_year),
    showZoneName: center.zones.filter((zone) => zone.status === 'active').length > 1,
  }
}

// Matches a YYYY-MM-DD date.
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export interface ArchiveWindowQuery {
  zoneSlug: string
  from: string
  to: string
}

/** The date picker asks for one month at a time; this leaves room for a month plus its edges. */
const MAX_WINDOW_DAYS = 62

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Validate the `zone`/`from`/`to` query the archive endpoint is called with. Returns `null` when
 * anything is missing, malformed, runs backwards, or spans more than MAX_WINDOW_DAYS — the caller
 * answers 400. The cap keeps one request from pulling years of a center's archive upstream.
 */
export function parseArchiveWindowQuery(
  zoneSlug: string | null,
  from: string | null,
  to: string | null,
): ArchiveWindowQuery | null {
  const window = parseDateWindow(from, to)
  if (!zoneSlug || !window) return null

  return { zoneSlug, ...window }
}

/** A real `YYYY-MM-DD` day, not just the pattern: `2026-13-45` matches the pattern alone. */
export function isCalendarDate(date: string): boolean {
  return DATE_PATTERN.test(date) && isValid(parseISO(date))
}

/** A `from`..`to` window of `YYYY-MM-DD` dates, or `null` when either is missing or malformed or the window runs backwards. */
export function parseDateWindow(
  from: string | null,
  to: string | null,
): { from: string; to: string } | null {
  if (!from || !to) return null
  if (!DATE_PATTERN.test(from) || !DATE_PATTERN.test(to)) return null
  if (from > to) return null
  if ((Date.parse(to) - Date.parse(from)) / DAY_MS > MAX_WINDOW_DAYS) return null

  return { from, to }
}
