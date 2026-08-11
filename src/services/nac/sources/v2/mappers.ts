/**
 * Pure v2 → normalized-model mappers (the unit-tested seam).
 *
 * For the legacy v2 backend the wire shape already matches the model field-for-field, so
 * these mappers are largely structural — but they are written out explicitly because this
 * is where backend deviations are absorbed. The one real v2 normalization today is the
 * warning null-object → `null` collapse; when a v3 source lands, its deviations (200-null
 * vs 404 on miss, datetime offset formatting, etc.) are handled in a sibling v3 mapper that
 * targets the same model, with no change to consumers.
 */
import type {
  Forecast,
  ForecastResult,
  Summary,
  WarningProduct,
  Weather,
} from '../../model/forecast'
import { ProductType } from '../../model/forecast'
import type { ZoneFeature, ZoneMapLayer } from '../../model/mapLayer'
import type {
  ForecastResult as V2ForecastResult,
  WarningResult as V2WarningResult,
  Weather as V2Weather,
} from '../../types/forecastSchemas'
import type { MapLayer as V2MapLayer, MapLayerFeature as V2ZoneFeature } from '../../types/schemas'

type V2Forecast = Extract<V2ForecastResult, { product_type: ProductType.Forecast }>
type V2Summary = Extract<V2ForecastResult, { product_type: ProductType.Summary }>
type V2WarningProduct = Exclude<V2WarningResult, { avalanche_center: null }>

function mapForecast(p: V2Forecast): Forecast {
  return {
    id: p.id,
    product_type: p.product_type,
    status: p.status,
    author: p.author,
    published_time: p.published_time,
    expires_time: p.expires_time,
    created_at: p.created_at,
    updated_at: p.updated_at,
    announcement: p.announcement,
    bottom_line: p.bottom_line,
    forecast_avalanche_problems: p.forecast_avalanche_problems,
    hazard_discussion: p.hazard_discussion,
    danger: p.danger,
    danger_level_text: p.danger_level_text,
    weather_discussion: p.weather_discussion,
    weather_data: p.weather_data,
    media: p.media,
    avalanche_center: p.avalanche_center,
    forecast_zone: p.forecast_zone,
  }
}

function mapSummary(p: V2Summary): Summary {
  return {
    id: p.id,
    product_type: p.product_type,
    status: p.status,
    author: p.author,
    published_time: p.published_time,
    expires_time: p.expires_time,
    created_at: p.created_at,
    updated_at: p.updated_at,
    announcement: p.announcement,
    bottom_line: p.bottom_line,
    hazard_discussion: p.hazard_discussion,
    danger_level_text: p.danger_level_text,
    weather_discussion: p.weather_discussion,
    weather_data: p.weather_data,
    media: p.media,
    avalanche_center: p.avalanche_center,
    forecast_zone: p.forecast_zone,
  }
}

/** Map a v2 forecast/summary product into the normalized model. */
export function mapV2ForecastResult(wire: V2ForecastResult): ForecastResult {
  return wire.product_type === ProductType.Forecast ? mapForecast(wire) : mapSummary(wire)
}

/** Map a v2 weather product into the normalized model (structural — the wire shape matches). */
export function mapV2Weather(p: V2Weather): Weather {
  return {
    id: p.id,
    product_type: p.product_type,
    status: p.status,
    author: p.author,
    published_time: p.published_time,
    created_at: p.created_at,
    updated_at: p.updated_at,
    announcement: p.announcement,
    danger_level_text: p.danger_level_text,
    weather_discussion: p.weather_discussion,
    weather_data: p.weather_data,
    avalanche_center: p.avalanche_center,
    forecast_zone: p.forecast_zone,
  }
}

function mapWarningProduct(p: V2WarningProduct): WarningProduct {
  const base = {
    id: p.id,
    published_time: p.published_time,
    expires_time: p.expires_time,
    created_at: p.created_at,
    updated_at: p.updated_at,
    reason: p.reason,
    affected_area: p.affected_area,
    bottom_line: p.bottom_line,
    hazard_discussion: p.hazard_discussion,
    avalanche_center: p.avalanche_center,
  }
  switch (p.product_type) {
    case ProductType.Warning:
      return { ...base, product_type: ProductType.Warning }
    case ProductType.Watch:
      return { ...base, product_type: ProductType.Watch }
    case ProductType.Special:
      return { ...base, product_type: ProductType.Special }
  }
}

/**
 * Map a v2 warning result into the normalized model. v2 returns a null-object
 * (`avalanche_center: null`) when no alert is active; the model represents that as `null`.
 */
export function mapV2Warning(wire: V2WarningResult): WarningProduct | null {
  if (wire.avalanche_center === null) return null
  return mapWarningProduct(wire)
}

/**
 * One zone feature, v2 → model. Every optional field is made explicit as `null`.
 *
 * The complexity here is 16 `??` operators and nothing else — making each optional field explicit
 * IS the mapper's job, and splitting it would scatter the wire shape across several functions for
 * no gain.
 */
// fallow-ignore-next-line complexity
function mapZoneFeature(feature: V2ZoneFeature): ZoneFeature {
  const p = feature.properties
  return {
    type: 'Feature',
    id: feature.id ?? null,
    geometry: feature.geometry,
    properties: {
      name: p.name,
      center: p.center ?? null,
      center_link: p.center_link ?? null,
      timezone: p.timezone ?? null,
      center_id: p.center_id,
      state: p.state ?? null,
      off_season: p.off_season ?? false,
      travel_advice: p.travel_advice ?? null,
      danger: p.danger ?? null,
      danger_level: p.danger_level,
      color: p.color ?? null,
      stroke: p.stroke ?? null,
      font_color: p.font_color ?? null,
      link: p.link ?? null,
      start_date: p.start_date ?? null,
      end_date: p.end_date ?? null,
      warning: { product: p.warning?.product ?? null },
    },
  }
}

/**
 * Map a v2 map-layer response into the normalized model.
 *
 * Three v2 deviations are absorbed here:
 * - **`features` can be null.** The legacy query aggregates with `json_agg`, which returns null
 *   rather than an empty array when a center has no active zones. v3 returns `[]`. The model
 *   always has an array, so a center between seasons never crashes a consumer's `.map`.
 * - **Optional properties are made explicit** as `null`, so consumers never distinguish
 *   "missing key" from "no value".
 * - **`warning` is normalized to an object**, since an absent one has to collapse to
 *   `{product: null}` for the warning test to stay a simple truthiness check.
 */
export function mapV2MapLayer(wire: V2MapLayer): ZoneMapLayer {
  return {
    type: 'FeatureCollection',
    features: (wire.features ?? []).map(mapZoneFeature),
  }
}
