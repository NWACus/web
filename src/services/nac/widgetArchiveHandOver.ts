/**
 * Where a widget center's dated address lands (Forecast-242): the widget's archived-forecast
 * address for that day's product, or the plain zone page when that product is the live one, which
 * the widget would label archived. Decided per request by `[zone]/[date]/widget`, since the live
 * product changes daily and the dated page's own redirect is cached with it.
 */
import { buildZoneArchiveDates, initialArchiveWindow, widgetArchiveAddress } from './archiveDates'
import { fetchProductArchive, getAvalancheCenterMetadata } from './nac'
import { resolveZoneFromSlug } from './resolveZone'
import { getForecastSource } from './sources'

/**
 * The address, or null for a zone with no widget page. Anything that can't be read lands on the
 * zone page: a failed live read keeps the archived address, as before this check existed.
 */
export async function widgetArchiveHandOverAddress(
  centerSlug: string,
  zoneSlug: string,
  date: string,
): Promise<string | null> {
  try {
    const [zone, metadata] = await Promise.all([
      resolveZoneFromSlug(centerSlug, zoneSlug),
      getAvalancheCenterMetadata(centerSlug),
    ])
    if (!zone) return null

    const [archive, live] = await Promise.all([
      fetchProductArchive(centerSlug, initialArchiveWindow(date)),
      getForecastSource(centerSlug)
        .getForecastFresh(centerSlug, zone.zone.id)
        .catch(() => null),
    ])
    const dates = buildZoneArchiveDates(archive, zone.zone.id, metadata.timezone)
    return widgetArchiveAddress(
      { slug: zone.slug, zoneId: zone.zone.zone_id },
      dates,
      date,
      metadata.timezone,
      live?.id ?? null,
    )
  } catch {
    return `/forecasts/avalanche/${zoneSlug}`
  }
}
