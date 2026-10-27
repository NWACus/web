/**
 * Wire schemas for the public observation API (`/obs/v1/public`, observation-api).
 *
 * Lenient by design. The API echoes much of what submitters stored without validating it — the
 * `instability` and `advanced_fields` JSON is unenforced, `media` carries at least four shapes
 * from different eras of the form, and nearly every column is nullable — so these schemas accept
 * what real records carry and leave the normalizing to `sources/v2/observationMappers.ts`. A record
 * the schema still rejects fails the whole response, which the pages show as an error rather than
 * a list quietly missing rows.
 */
import { z } from 'zod'

import { mediaItemSchema } from './forecastSchemas'

/**
 * Booleans in the loose JSON columns; only a real `true` (or its string) counts. `.optional()`
 * because zod 4 requires a key whose transformed output can't be undefined.
 */
const looseBooleanSchema = z
  .unknown()
  .optional()
  .transform((value) => value === true || value === 'true')

const nullableStringSchema = z.string().nullish()

/** Numbers that some records store as strings, and some as empty strings. */
const looseNumberSchema = z.union([z.number(), z.string()]).nullish()

/** `{lat, lng}`, where either half may be null on records submitted without a location. */
const locationPointSchema = z
  .object({ lat: z.number().nullish(), lng: z.number().nullish() })
  .nullish()

/**
 * A media list. Dashboard-sourced records have been seen with a non-array here (the widget
 * normalizes with an `arrayCheck`), and any single item may be empty or null, which the forecast
 * `mediaItemSchema` already catches as `unknown`.
 */
const mediaListSchema = z
  .unknown()
  .optional()
  .transform((value) => (Array.isArray(value) ? value : []))
  .pipe(z.array(mediaItemSchema))

const instabilitySchema = z
  .object({
    avalanches_observed: looseBooleanSchema,
    avalanches_triggered: looseBooleanSchema,
    avalanches_caught: looseBooleanSchema,
    cracking: looseBooleanSchema,
    cracking_description: nullableStringSchema,
    collapsing: looseBooleanSchema,
    collapsing_description: nullableStringSchema,
  })
  .nullish()

export type ObservationInstabilityWire = z.infer<typeof instabilitySchema>

const weatherSchema = z
  .object({
    air_temp: looseNumberSchema,
    cloud_cover: nullableStringSchema,
    wind_loading: nullableStringSchema,
    rain_elevation: looseNumberSchema,
    recent_snowfall: looseNumberSchema,
    snow_avail_for_transport: nullableStringSchema,
  })
  .nullish()

const observedProblemSchema = z.object({
  type: nullableStringSchema,
  depth: looseNumberSchema,
  layer: nullableStringSchema,
  d_size: z.array(z.union([z.number(), z.string(), z.null()])).nullish(),
  comments: nullableStringSchema,
  location: z.array(z.string()).nullish(),
  sensitivity: nullableStringSchema,
  distribution: nullableStringSchema,
})

export type ObservedProblemWire = z.infer<typeof observedProblemSchema>

const advancedFieldsSchema = z
  .object({
    time_in_field: z.object({ start: looseNumberSchema, end: looseNumberSchema }).nullish(),
    weather: weatherSchema,
    weather_summary: nullableStringSchema,
    snowpack_summary: nullableStringSchema,
    snowpack_media: mediaListSchema,
    avalanche_problems: z.array(observedProblemSchema).nullish(),
    avalanche_problems_comments: nullableStringSchema,
  })
  .nullish()

/** One avalanche record, standalone or nested in its observation. */
export const avalancheRecordSchema = z.object({
  id: z.string(),
  observation_id: nullableStringSchema,
  created_at: z.string(),
  observer_type: nullableStringSchema,
  organization: nullableStringSchema,
  center_id: nullableStringSchema,
  obs_source: nullableStringSchema,
  forecaster_verified: z.boolean().nullish(),
  forecaster_edited: z.boolean().nullish(),
  forecaster_edited_reason: nullableStringSchema,
  name: nullableStringSchema,
  show_name: z.boolean().nullish(),
  obs_date: nullableStringSchema,
  date: nullableStringSchema,
  date_known: z.boolean().nullish(),
  time: nullableStringSchema,
  time_known: z.boolean().nullish(),
  location_point: locationPointSchema,
  location_name: nullableStringSchema,
  number: looseNumberSchema,
  aspect: nullableStringSchema,
  aspect_range: z.array(z.string()).nullish(),
  elevation: looseNumberSchema,
  avalanche_type: nullableStringSchema,
  avalanche_problem: nullableStringSchema,
  trigger: nullableStringSchema,
  cause: nullableStringSchema,
  bed_sfc: nullableStringSchema,
  avg_crown_depth: looseNumberSchema,
  d_size: looseNumberSchema,
  r_size: looseNumberSchema,
  weak_layer_date: nullableStringSchema,
  weak_layer_type: nullableStringSchema,
  width: looseNumberSchema,
  vertical_fall: looseNumberSchema,
  slope_angle: looseNumberSchema,
  terminus: nullableStringSchema,
  media: mediaListSchema,
  attachment_url: nullableStringSchema,
  attachment_description: nullableStringSchema,
  comments: nullableStringSchema,
  humans_caught: looseNumberSchema,
  humans_part_buried_non_crit: looseNumberSchema,
  humans_part_buried_crit: looseNumberSchema,
  humans_fully_buried: looseNumberSchema,
  humans_injured: looseNumberSchema,
  humans_killed: looseNumberSchema,
  vehicles_hit: looseNumberSchema,
  vehicles_fully_buried: looseNumberSchema,
  vehicles_damaged: looseNumberSchema,
  vehicles_damage_cost: looseNumberSchema,
  structures_hit: looseNumberSchema,
  structures_damaged: looseNumberSchema,
  structures_destroyed: looseNumberSchema,
  structures_damage_cost: looseNumberSchema,
  impacts_comments: nullableStringSchema,
  zone_id: z.union([z.string(), z.number()]).nullish(),
  zone_name: nullableStringSchema,
})

export type AvalancheRecordWire = z.infer<typeof avalancheRecordSchema>

export const observationRecordSchema = z.object({
  id: z.string(),
  center_id: nullableStringSchema,
  obs_source: nullableStringSchema,
  created_at: z.string(),
  observer_type: nullableStringSchema,
  organization: nullableStringSchema,
  organization_url: nullableStringSchema,
  name: nullableStringSchema,
  show_name: z.boolean().nullish(),
  start_date: nullableStringSchema,
  end_date: nullableStringSchema,
  activity: z.array(z.string()).nullish(),
  location_point: locationPointSchema,
  location_name: nullableStringSchema,
  route: nullableStringSchema,
  instability: instabilitySchema,
  instability_summary: nullableStringSchema,
  observation_summary: nullableStringSchema,
  media: mediaListSchema,
  urls: z.array(z.string()).nullish(),
  avalanches_summary: nullableStringSchema,
  advanced_fields: advancedFieldsSchema,
  avalanches: z.array(avalancheRecordSchema).nullish(),
  zone_id: z.union([z.string(), z.number()]).nullish(),
  zone_name: nullableStringSchema,
})

export type ObservationRecordWire = z.infer<typeof observationRecordSchema>

/** The paginated list envelope, shared by `/observation/list/` and `/avalanche_observation/list/`. */
function listEnvelopeSchema<T extends z.ZodTypeAny>(record: T) {
  return z.object({
    total: z.number(),
    pages: z.number(),
    current_page: z.number(),
    // The sum of `number` over every matching avalanche; null on the observation list.
    avalanche_total_number: z.number().nullish(),
    results: z.array(record),
  })
}

export const observationListSchema = listEnvelopeSchema(observationRecordSchema)
export const avalancheListSchema = listEnvelopeSchema(avalancheRecordSchema)

const polygonGeometrySchema = z.union([
  z.object({ type: z.literal('Polygon'), coordinates: z.array(z.array(z.array(z.number()))) }),
  z.object({
    type: z.literal('MultiPolygon'),
    coordinates: z.array(z.array(z.array(z.array(z.number())))),
  }),
])

/** `/obs_zone/combined_zones/`: a center's forecast zones and its observation-only zones. */
export const combinedZonesSchema = z.array(
  z.object({
    zone_id: z.union([z.string(), z.number()]).transform(String),
    name: z.string(),
    center_id: z.array(z.string()).nullish(),
    status: nullableStringSchema,
    zone_type: z.string(),
    priority: z.number().nullish(),
    geom: polygonGeometrySchema.nullish(),
  }),
)

export type CombinedZonesWire = z.infer<typeof combinedZonesSchema>
