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
import { parseISO } from 'date-fns/parseISO'
import { startOfMonth } from 'date-fns/startOfMonth'
import { subMonths } from 'date-fns/subMonths'

/** Product types that the native forecast view can render (others, e.g. synopsis, are skipped). */
const RENDERABLE_PRODUCT_TYPES = new Set(['forecast', 'summary'])

/**
 * The minimal slice of an archive product this module needs. The full archive is ~13MB for
 * NWAC — too large for Next's 2MB data cache — so callers cache only these fields (~1MB).
 */
export interface ArchiveProductSummary {
  id: number
  product_type: string
  published_time: string
  /** Overall danger rating (0-5; -1 = general info). Used to color the picker. */
  danger_rating: number
  forecast_zone: { id: number }[]
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
 */
export function buildZoneArchiveDates(
  items: ArchiveProductSummary[],
  zoneId: number,
  timezone: string | null | undefined,
): ZoneArchiveDate[] {
  const byDate = new Map<
    string,
    { productId: number; productType: string; publishedTime: string; dangerRating: number }
  >()

  for (const item of items) {
    if (!RENDERABLE_PRODUCT_TYPES.has(item.product_type)) continue
    if (!item.forecast_zone.some((zone) => zone.id === zoneId)) continue

    const date = validDateForProduct(item.published_time, timezone)
    if (!date) continue

    const existing = byDate.get(date)
    // ISO-8601 timestamps compare correctly as strings; keep the latest publication.
    if (!existing || item.published_time > existing.publishedTime) {
      byDate.set(date, {
        productId: item.id,
        productType: item.product_type,
        publishedTime: item.published_time,
        dangerRating: item.danger_rating,
      })
    }
  }

  return Array.from(byDate.entries())
    .map(([date, value]) => ({
      date,
      productId: value.productId,
      productType: value.productType,
      dangerRating: value.dangerRating,
    }))
    .sort((a, b) => b.date.localeCompare(a.date))
}

/** Resolve a `YYYY-MM-DD` date to its product id within a prebuilt zone date list. */
export function findProductIdForDate(archiveDates: ZoneArchiveDate[], date: string): number | null {
  return archiveDates.find((entry) => entry.date === date)?.productId ?? null
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
