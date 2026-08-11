/**
 * The Mapbox source and layers the danger map draws its zones with.
 *
 * All zones live in **one** `geojson` source and two layers, rather than the source-and-two-layers
 * *per zone* that both existing NAC implementations use. Per-zone appearance rides in each
 * feature's own properties (baked in by `decorateZoneFeatures`), and per-zone *state* — hover,
 * warning flash — goes through `setFeatureState`, which is what the stable feature `id` is for.
 */
import type { FillLayerSpecification, LineLayerSpecification } from 'mapbox-gl'

import type { ZoneRenderFeature } from '@/services/nac/dangerMap/dangerMapZones'

export const SOURCE_ID = 'forecast-zones'
export const FILL_LAYER_ID = 'forecast-zones-fill'
export const OUTLINE_LAYER_ID = 'forecast-zones-outline'

export const OUTLINE_WIDTH = 2
export const OUTLINE_HOVER_WIDTH = 4

/**
 * Both fill properties read the style precomputed per feature, so the off-season / no-rating /
 * extreme precedence lives in one tested function rather than being restated as a Mapbox
 * expression that could drift from it.
 */
export const FILL_PAINT: FillLayerSpecification['paint'] = {
  'fill-color': ['get', 'fillColor'],
  // The flash overrides the zone's own opacity while it runs; with no flash state set — every
  // zone without a warning, always — this falls through to the baked value.
  'fill-opacity': ['coalesce', ['feature-state', 'flashOpacity'], ['get', 'fillOpacity']],
}

export const OUTLINE_PAINT: LineLayerSpecification['paint'] = {
  'line-color': ['get', 'strokeColor'],
  'line-width': [
    'case',
    ['boolean', ['feature-state', 'hover'], false],
    OUTLINE_HOVER_WIDTH,
    OUTLINE_WIDTH,
  ],
}

/**
 * Narrow the zone collection to what Mapbox's GeoJSON source accepts: a zone whose geometry failed
 * validation upstream is dropped (it has nothing to draw), and a missing feature id becomes
 * `undefined` rather than `null`.
 */
export function toMapboxCollection(features: ZoneRenderFeature[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: features.flatMap((feature) =>
      feature.geometry === null
        ? []
        : [
            {
              type: 'Feature' as const,
              id: feature.id ?? undefined,
              geometry: feature.geometry,
              properties: feature.properties,
            },
          ],
    ),
  }
}
