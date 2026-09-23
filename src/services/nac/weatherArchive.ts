/**
 * Pure logic behind the forecast archive's Mountain Weather tab: which of a center's archived
 * products are listed there and how they are dated, filtered and linked. Shares the season model,
 * filter resolution and pagination with the forecast list (`./forecastArchive`).
 *
 * Reproduces the legacy afp archive browser's weather view (`views/Archive.vue`, route
 * `ArchiveWeather`): every published weather product, newest first, one row each — a weather
 * product covers every zone, so there is no per-zone expansion and only the season and date range
 * filter it.
 */
import { publishedDateForProduct, type ArchiveProductSummary } from './archiveDates'
import { ARCHIVE_WEATHER_PATH } from './forecastArchive'

export interface WeatherArchiveRow {
  productId: number
  /** The day the product was issued, as `yyyy-MM-dd` in the center's timezone. */
  date: string
  author: string | null
  publishedTime: string
}

/**
 * The tab's rows for a center's archive, newest first. A row is dated by the day it was issued,
 * with no noon cutover: weather is a morning product, and the legacy tab labels each by its
 * `start_date`, which for weather is the published time. The legacy tab printed that day in the
 * reader's timezone; here it is the center's, as everywhere else in the archive.
 *
 * Unlike the forecast list, a day with two products lists both. Each row links by id, as the
 * legacy row did, so a same-day re-issue is a distinct destination rather than a duplicate link.
 * The legacy rule that hides products with a null `updated_at` is kept.
 */
export function buildWeatherArchiveRows(
  items: ArchiveProductSummary[],
  timezone: string | null | undefined,
): WeatherArchiveRow[] {
  const rows: WeatherArchiveRow[] = []

  for (const item of items) {
    if (item.product_type !== 'weather' || item.updated_at === null) continue

    const date = publishedDateForProduct(item.published_time, timezone)
    if (!date) continue

    rows.push({
      productId: item.id,
      date,
      author: item.author,
      publishedTime: item.published_time,
    })
  }

  // ISO-8601 timestamps compare correctly as strings.
  return rows.sort((a, b) => b.publishedTime.localeCompare(a.publishedTime))
}

/** The rows within the selected date range — the only filter the weather tab applies. */
export function applyWeatherArchiveFilters(
  rows: WeatherArchiveRow[],
  range: { from: string; to: string },
): WeatherArchiveRow[] {
  return rows.filter((row) => row.date >= range.from && row.date <= range.to)
}

/** Where a row links: the archived weather product, by id. */
export function weatherArchiveRowHref(row: Pick<WeatherArchiveRow, 'productId'>): string {
  return `${ARCHIVE_WEATHER_PATH}/${row.productId}`
}
