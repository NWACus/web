/**
 * Map-layer reads, through the source adapter.
 *
 * Two surfaces consume the zone map layer and they want different slices of it: the danger map
 * wants every zone's geometry and style, while the forecast page and its OG image want one zone's
 * danger properties. Both go through `MapLayerSource`, so flipping the map layer from v2 to v3 is
 * the Control 2 env change and nothing here moves.
 */
import type { ZoneMapLayer, ZoneProperties } from '../model/mapLayer'
import { zoneSlugFromUrl } from '../nac'
import { getMapLayerSource, type MapLayerQuery } from '../sources'

/** The center's zones with their danger overlay. */
export function getZoneMapLayer(
  centerSlug: string,
  query: MapLayerQuery = {},
): Promise<ZoneMapLayer> {
  return getMapLayerSource(centerSlug).getMapLayer(centerSlug, query)
}

/**
 * One zone's danger properties, found by the forecast-page slug at the end of its `link`.
 *
 * This is how the forecast page and the OG image get a rating without fetching a whole forecast
 * product — the map layer already carries the rating, color and travel advice for every zone in a
 * single cached request. Returns null when no zone matches.
 */
export async function getForecastZoneDanger(
  centerSlug: string,
  zoneSlug: string,
): Promise<ZoneProperties | null> {
  const mapLayer = await getZoneMapLayer(centerSlug)

  const feature = mapLayer.features.find(
    (f) => f.properties.link && zoneSlugFromUrl(f.properties.link) === zoneSlug,
  )

  return feature?.properties ?? null
}
