import { normalizeCenterSlug } from './centerSlug'
import { getActiveForecastZones, type ActiveForecastZoneWithSlug } from './nac'

/**
 * Resolve a URL zone slug to the full zone object with numeric ID.
 * Applies the DVAC->NWAC alias before looking up zones.
 */
export async function resolveZoneFromSlug(
  centerSlug: string,
  zoneSlug: string,
): Promise<ActiveForecastZoneWithSlug | null> {
  const centerSlugToUse = normalizeCenterSlug(centerSlug)

  const zones = await getActiveForecastZones(centerSlugToUse)

  return zones.find((z) => z.slug === zoneSlug) ?? null
}
