import { buildZoneArchiveDates, findProductIdForDate, initialArchiveWindow } from './archiveDates'
import type { ForecastResult } from './model/forecast'
import { fetchProductArchive, fetchProductById, getAvalancheCenterMetadata } from './nac'
import { resolveZoneFromSlug } from './resolveZone'

/**
 * The product a dated forecast address shows: the zone-day's product in the archive window the
 * dated page loads, fetched by id. These are the same cached reads the page makes, so calling this
 * beside it (from its metadata) adds no upstream request. Null when there is no such product.
 */
export async function findDatedForecast(
  centerSlug: string,
  zoneSlug: string,
  date: string,
): Promise<ForecastResult | null> {
  const [resolvedZone, metadata] = await Promise.all([
    resolveZoneFromSlug(centerSlug, zoneSlug),
    getAvalancheCenterMetadata(centerSlug),
  ])
  if (!resolvedZone) return null

  const archive = await fetchProductArchive(centerSlug, initialArchiveWindow(date))
  const dates = buildZoneArchiveDates(archive, resolvedZone.zone.id, metadata.timezone)
  const productId = findProductIdForDate(dates, date)

  return productId === null ? null : fetchProductById(productId)
}
