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
export type AvalancheCenterCapabilities = z.infer<typeof avalancheCenterCapabilitiesSchema>

export const allAvalancheCenterCapabilitiesSchema = z.object({
  centers: z.array(avalancheCenterCapabilitiesSchema),
})
export type AllAvalancheCenterCapabilities = z.infer<typeof allAvalancheCenterCapabilitiesSchema>

export const latLngSchema = z.object({
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
})

export const avalancheCenterWeatherConfigurationSchema = z.object({
  zone_id: z.string(),
  forecast_point: latLngSchema,
  forecast_url: z.string().nullable(),
})

export const nacWidgetConfigurationSchema = z.object({
  avalancheCenterPlatforms: avalancheCenterPlatformsSchema,
  baseUrl: z.string(),
  version: z.string(),
})
export type NacWidgetConfigurationSchema = z.infer<typeof nacWidgetConfigurationSchema>

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

export enum AvalancheCenterType {
  Nonprofit = 'nonprofit',
  State = 'state',
  USFS = 'usfs',
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

export const avalancheCenterDangerMapWidgetConfigurationSchema = z.object({
  height: z.union([z.string(), z.number()]),
  saturation: z.union([z.string(), z.number()]),
  search: z.boolean(),
  geolocate: z.boolean(),
  advice: z.boolean(),
  center: latLngSchema,
  zoom: z.number(),
})

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
export type AvalancheForecastZone = z.infer<typeof avalancheForecastZoneSchema>

export const nationalWeatherServiceZoneSchema = z.object({
  id: z.number(),
  zone_name: z.string(),
  zone_id: z.string(),
  state: z.string(),
  city: z.string(),
  contact: z.string().nullable(),
  zone_state: z.string(),
})

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
