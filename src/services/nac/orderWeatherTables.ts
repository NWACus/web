/**
 * The order a weather product's per-zone tables are shown in: the center's zone order, as the
 * legacy widget's `WeatherContent.vue` sorted them. A table names its zone by the center's short
 * `zone_id` (a string such as `"3"`), not the numeric product-zone `id`, so that is what it is
 * matched on; a table for a zone the center no longer lists sorts last, in its original position.
 */
import type { WeatherTable } from './model/forecast'

/** The two zone fields the ordering reads, so callers can pass the center metadata's zones as-is. */
export interface WeatherTableZone {
  zone_id: string
  rank?: number | null
}

const UNRANKED = Number.POSITIVE_INFINITY

export function orderWeatherTables<T extends WeatherTable>(
  tables: T[],
  zones: WeatherTableZone[],
): T[] {
  const rankByZoneId = new Map(zones.map((zone) => [zone.zone_id, zone.rank ?? UNRANKED]))

  return tables
    .map((table, index) => ({ table, index, rank: rankByZoneId.get(table.zone_id) ?? UNRANKED }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((entry) => entry.table)
}
