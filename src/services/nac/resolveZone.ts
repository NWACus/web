import {
  getActiveForecastZones,
  getAvalancheCenterMetadata,
  type ActiveForecastZoneWithSlug,
  type ActiveZone,
  type AvalancheCenterZone,
} from './nac'
import { zoneSlugFromUrl } from './zoneSlug'

/**
 * Resolve a URL zone slug to the full zone object with numeric ID.
 * Applies the DVAC->NWAC alias before looking up zones.
 */
export async function resolveZoneFromSlug(
  centerSlug: string,
  zoneSlug: string,
): Promise<ActiveForecastZoneWithSlug | null> {
  const centerSlugToUse = centerSlug === 'dvac' ? 'nwac' : centerSlug

  const zones = await getActiveForecastZones(centerSlugToUse)

  return zones.find((z) => z.slug === zoneSlug) ?? null
}

/** What a forecast page needs to know about its zone, whether or not the zone is still active. */
export type ForecastZoneFacts = Pick<ActiveZone, 'id' | 'name' | 'zone_id' | 'config'>

/** A zone the dated route can show: an active one, or a retired one with an address of its own. */
export interface DatedForecastZone {
  slug: string
  /** False for a retired zone, which keeps dated addresses but has no live page. */
  active: boolean
  zone: ForecastZoneFacts
}

/**
 * The retired zone a slug names, as the widget's archived addresses reach any zone in `all_zones`.
 * Its slug comes from its URL the same way an active zone's does. Only an unambiguous slug
 * resolves: several centers point retired zones at one shared URL (Mount Washington's at
 * `/advisory/`), and a slug an active zone also uses is that zone's. A retired zone without band
 * names can't render its danger, so it has no address either.
 */
export function retiredZoneForSlug(
  zones: AvalancheCenterZone[],
  zoneSlug: string,
): DatedForecastZone | null {
  const named = zones.filter((zone) => zone.url && zoneSlugFromUrl(zone.url) === zoneSlug)
  if (named.length !== 1) return null

  const [zone] = named
  if (zone.status !== 'disabled' || !zone.config) return null

  return {
    slug: zoneSlug,
    active: false,
    zone: { id: zone.id, name: zone.name, zone_id: zone.zone_id, config: zone.config },
  }
}

/**
 * Resolve a slug for the dated route: an active zone first, then a retired one, so a retired
 * zone's past forecasts stay reachable. The live route and the freshness checks stay on
 * `resolveZoneFromSlug`, as the widget's live addresses match active zones only.
 */
export async function resolveDatedZoneFromSlug(
  centerSlug: string,
  zoneSlug: string,
): Promise<DatedForecastZone | null> {
  const active = await resolveZoneFromSlug(centerSlug, zoneSlug)
  if (active) return { slug: active.slug, active: true, zone: active.zone }

  const metadata = await getAvalancheCenterMetadata(centerSlug)
  return retiredZoneForSlug(metadata.zones, zoneSlug)
}
