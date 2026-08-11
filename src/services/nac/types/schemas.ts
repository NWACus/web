import { z } from 'zod'

export const avalancheCenterPlatformsSchema = z.object({
  warnings: z.boolean(),
  forecasts: z.boolean(),
  stations: z.boolean(),
  obs: z.boolean(),
  weather: z.boolean(),
})
export type AvalancheCenterPlatforms = z.infer<typeof avalancheCenterPlatformsSchema>

export const avalancheCenterCapabilitiesSchema = z.object({
  id: z.string(),
  display_id: z.string(),
  platforms: avalancheCenterPlatformsSchema,
})

export const allAvalancheCenterCapabilitiesSchema = z.object({
  centers: z.array(avalancheCenterCapabilitiesSchema),
})

// The upstream API spells these `lat`/`lng` everywhere it returns a point — the danger-map and
// stations widget configs and the weather table's forecast point. Modeling them as
// `latitude`/`longitude` parsed fine (both keys are optional) but silently yielded `{}`, so no
// caller could ever read a coordinate.
export const latLngSchema = z.object({
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
})

export const avalancheCenterWeatherConfigurationSchema = z.object({
  zone_id: z.string(),
  forecast_point: latLngSchema,
  forecast_url: z.string().nullable(),
})

export const avalancheCenterConfigurationSchema = z.object({
  // expires_time and published_time seem to be fractional hours past midnight, in the locale
  expires_time: z
    .number()
    .nullable()
    .transform((n) => n ?? 0),
  published_time: z
    .number()
    .nullable()
    .transform((n) => n ?? 0),
  blog: z.boolean(),
  blog_title: z.string(),
  weather_table: z.array(avalancheCenterWeatherConfigurationSchema),
  zone_order: z.array(z.number()).optional(),
})

/**
 * Upstream's avalanche-center `type`.
 *
 * Every member is load-bearing through `avalancheCenterTypeSchema` below: `z.nativeEnum` validates
 * against the member *values*, so dropping one would make zod reject a real center. Only USFS is
 * referenced by name (the forecast disclaimer names the Forest Service), which is why the other
 * three read as unused.
 */
export enum AvalancheCenterType {
  // fallow-ignore-next-line unused-enum-member
  Nonprofit = 'nonprofit',
  // fallow-ignore-next-line unused-enum-member
  State = 'state',
  USFS = 'usfs',
  // fallow-ignore-next-line unused-enum-member
  Volunteer = 'volunteer',
}

export const avalancheCenterTypeSchema = z.nativeEnum(AvalancheCenterType)

export const avalancheCenterForecastWidgetTabSchema = z.object({
  name: z.string(),
  id: z.string(),
  url: z.string(),
})

export const avalancheCenterForecastWidgetConfigurationSchema = z.object({
  color: z.string(),
  elevInfoUrl: z.string(),
  glossary: z.boolean(),
  tabs: z.array(avalancheCenterForecastWidgetTabSchema),
})

// Written by dashboard-v2's danger-map settings page (`app/utils/dangerMapSettings.js`), which is
// the contract the native map honors. Everything below `advice` is optional because a center whose
// forecasters never opened that page has a partial object — NWAC, for one, has no `allCenters`.
export const avalancheCenterDangerMapWidgetConfigurationSchema = z.object({
  height: z.union([z.string(), z.number()]),
  // Stored and editable in dashboard-v2, but no Mapbox consumer applies it — see
  // `dangerMapSettings.ts`. Kept so the shape round-trips.
  saturation: z.union([z.string(), z.number()]).optional(),
  search: z.boolean().optional(),
  geolocate: z.boolean().optional(),
  advice: z.boolean().optional(),
  allCenters: z.boolean().optional(),
  center: latLngSchema.optional(),
  zoom: z.number().optional(),
})
export type AvalancheCenterDangerMapWidgetConfiguration = z.infer<
  typeof avalancheCenterDangerMapWidgetConfigurationSchema
>

export const avalancheCenterObservationViewerWidgetConfigurationSchema = z.object({
  alternate_zones: z.string().nullable(),
  color: z.string(),
  obs_form_url: z.string().nullable().optional(),
  obs_tab: z.boolean().optional(),
  obs_view_url: z.string().nullable().optional(),
  saturation: z.number(),
  require_approval: z.boolean().optional(),
})

export enum Units {
  English = 'english',
  Metric = 'metric',
  // TODO: what else?
}

export const unitsSchema = z.nativeEnum(Units)

export const externalModalLinkSchema = z.object({
  link_name: z.string().optional(),
  area_plots: z.string().optional(),
  area_tables: z.string().optional(),
})

export const avalancheCenterStationsWidgetConfigurationSchema = z.object({
  center: latLngSchema.optional(),
  zoom: z.number().optional(),
  center_id: z.string().optional(),
  alternate_zones: z.any().optional(),
  units: unitsSchema.optional(),
  timezone: z.string().optional(),
  color_rules: z.boolean().optional(),
  source_legend: z.boolean().optional(),
  sources: z.array(z.string()).optional(),
  within: z.union([z.string(), z.number()]).optional(),
  external_modal_links: z
    .union([z.record(externalModalLinkSchema), z.array(externalModalLinkSchema)])
    .optional(),
  token: z.string().optional(),
})

// the widget configurations are present if and when each forecast center opts into specific NAC functionality
export const avalancheCenterWidgetConfigurationSchema = z.object({
  forecast: avalancheCenterForecastWidgetConfigurationSchema.optional(),
  danger_map: avalancheCenterDangerMapWidgetConfigurationSchema.optional(),
  observation_viewer: avalancheCenterObservationViewerWidgetConfigurationSchema.optional(),
  stations: avalancheCenterStationsWidgetConfigurationSchema.optional(),
})

export const elevationBandNamesSchema = z.object({
  lower: z.string(),
  middle: z.string(),
  upper: z.string(),
})
export type ElevationBandNames = z.infer<typeof elevationBandNamesSchema>

export const avalancheForecastZoneConfigurationSchema = z.object({
  elevation_band_names: elevationBandNamesSchema,
})

export enum AvalancheForecastZoneStatus {
  Active = 'active',
  Disabled = 'disabled',
}

export const avalancheForecastZoneSchema = z.discriminatedUnion('status', [
  z.object({
    id: z.number(),
    name: z.string(),
    url: z.string(),
    zone_id: z.string(),
    config: avalancheForecastZoneConfigurationSchema,
    status: z.literal(AvalancheForecastZoneStatus.Active),
    rank: z.number().nullable(),
  }),
  z.object({
    id: z.number(),
    name: z.string(),
    zone_id: z.string(),
    status: z.literal(AvalancheForecastZoneStatus.Disabled),
  }),
])

export const nationalWeatherServiceZoneSchema = z.object({
  id: z.number(),
  zone_name: z.string(),
  zone_id: z.string(),
  state: z.string(),
  city: z.string(),
  contact: z.string().nullable(),
  zone_state: z.string(),
})

/**
 * The active warning overlay upstream attaches to each zone. Always an object, never absent;
 * `product` is `"warning"` when one is active and `null` otherwise. The server-side query is
 * already filtered to `product = 'warning'`, so watches and special bulletins never appear here —
 * a non-null `product` is a complete warning test, no cross-check against the warnings endpoint
 * needed. (The center-level banner reads that other endpoint precisely because it *does* return
 * all three types.)
 */
export const mapLayerWarningSchema = z.object({
  product: z.string().nullable().optional(),
})

// `/v2/public/products/map-layer/{CENTER}` returns a GeoJSON FeatureCollection where each
// feature is a forecast zone. Everything the danger map draws — fill and stroke color, opacity,
// the popup's validity window and travel advice, the forecast link — comes from these properties,
// so the whole documented shape is modeled rather than the danger/advice subset the OG badge needs.
export const mapLayerFeaturePropertiesSchema = z.object({
  name: z.string(),
  center: z.string().nullable().optional(),
  center_link: z.string().nullable().optional(),
  timezone: z.string().nullable().optional(),
  center_id: z.string(),
  state: z.string().nullable().optional(),
  off_season: z.boolean().optional(),
  travel_advice: z.string().nullable().optional(),
  danger: z.string().nullable().optional(),
  danger_level: z.number(),
  color: z.string().nullable().optional(),
  stroke: z.string().nullable().optional(),
  font_color: z.string().nullable().optional(),
  link: z.string().nullable().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  fillOpacity: z.number().nullable().optional(),
  warning: mapLayerWarningSchema.nullable().optional(),
})
/**
 * Zone geometry, validated rather than passed through opaquely — the map hands these coordinates
 * straight to Mapbox, and `zoneBounds` walks them to fit the view. products-api guarantees
 * `Polygon` or `MultiPolygon` (a `GeometryCollection` is flattened server-side).
 */
const zonePositionSchema = z.tuple([z.number(), z.number()]).rest(z.number())

export const zoneGeometrySchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('Polygon'),
    coordinates: z.array(z.array(zonePositionSchema)),
  }),
  z.object({
    type: z.literal('MultiPolygon'),
    coordinates: z.array(z.array(z.array(zonePositionSchema))),
  }),
])

export const mapLayerFeatureSchema = z.object({
  type: z.string(),
  // A stable numeric zone id at the *feature* level, outside `properties`. Mapbox's
  // `setFeatureState` keys on exactly this, which is why the single-source danger map needs no
  // `promoteId`/`generateId` — verified present on every feature the v2 and v3 endpoints return.
  id: z.union([z.number(), z.string()]).optional(),
  // A geometry that doesn't validate yields null for that one zone rather than failing the whole
  // response: the map-layer is also what the forecast page's metadata and OG image read, and one
  // unexpected polygon must not take those down with it. A null-geometry zone simply isn't drawn.
  geometry: zoneGeometrySchema.nullable().catch(null),
  properties: mapLayerFeaturePropertiesSchema,
})

export type MapLayerFeature = z.infer<typeof mapLayerFeatureSchema>

export const mapLayerSchema = z.object({
  type: z.string(),
  // v2 aggregates with `json_agg`, which yields null rather than `[]` for a center with no active
  // zones; v3 returns `[]`. The mapper collapses both to an array so the model never has a null.
  features: z.array(mapLayerFeatureSchema).nullable(),
  start_time: z.string().nullable().optional(),
  end_time: z.string().nullable().optional(),
})
export type MapLayer = z.infer<typeof mapLayerSchema>

export const avalancheCenterSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  city: z.string(),
  state: z.string(),
  timezone: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  center_point: z.null(),
  created_at: z.string(),
  wkb_geometry: z.null(),
  config: avalancheCenterConfigurationSchema,
  type: avalancheCenterTypeSchema,
  widget_config: avalancheCenterWidgetConfigurationSchema,
  zones: z.array(avalancheForecastZoneSchema),
  nws_zones: z.array(nationalWeatherServiceZoneSchema),
  nws_offices: z.array(z.string()),
  off_season: z.boolean(),
})
export type AvalancheCenter = z.infer<typeof avalancheCenterSchema>
