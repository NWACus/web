/**
 * What a forecast's inline Mountain Weather section shows for one zone: that zone's table and the
 * product's discussion. Shared by the section itself and by the panel and print dialog, which must
 * agree with it about whether there is anything to show.
 */
import type { Weather, WeatherTable } from '@/services/nac/model/forecast'

export interface ZoneWeather {
  table: WeatherTable | null
  discussion: string | null
}

/**
 * The table for the zone, matched on the zone's short `zone_id` string (not its numeric `id`), as
 * the legacy widget did. No match shows no table: another zone's numbers are worse than none.
 */
export function weatherTableForZone<T extends WeatherTable>(tables: T[], zoneId: string): T | null {
  return tables.find((table) => table.zone_id === zoneId) ?? null
}

/** The zone's table and discussion, or `null` when the product has neither for it. */
export function zoneWeather(
  weather: Weather | null | undefined,
  zoneId: string,
): ZoneWeather | null {
  if (!weather) return null

  const table = weatherTableForZone(weather.weather_data, zoneId)
  const discussion = weather.weather_discussion?.trim() ? weather.weather_discussion : null

  return table || discussion ? { table, discussion } : null
}
