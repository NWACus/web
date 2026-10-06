/**
 * Zod schemas for products-api's public NWAC weather reads (`/v3/public/nwac-weather/…`), as
 * sent: flat rows with calendar dates already resolved, the rows and slots the forecast was
 * published with, and the template that names its format's sections.
 */
import { z } from 'zod'

const nullableNumber = z.number().nullable()

export const nwacWeatherIssuanceTypeSchema = z.enum(['morning', 'afternoon'])

export const nwacWeatherZoneSchema = z.object({
  id: z.string(),
  name: z.string(),
  avalancheZoneId: nullableNumber.optional(),
})

export const nwacWeatherPointSchema = z.object({
  code: z.string(),
  name: z.string(),
  /** The zone's display name, as typed into the point's settings. */
  zone: z.string().nullable().optional(),
  zoneId: z.string().nullable().optional(),
  avalancheZoneId: nullableNumber.optional(),
})

export const nwacWeatherPeriodSchema = z.object({
  key: z.string(),
  label: z.string(),
  short: z.string().nullable().optional(),
  kind: z.enum(['day', 'night']).nullable().optional(),
  /** `YYYY-MM-DD`, resolved server-side. */
  date: z.string(),
})

export const nwacWeatherBlockSchema = z.object({
  key: z.string(),
  label: z.string(),
  part: z.string().nullable().optional(),
  period: z.string().nullable().optional(),
})

export const nwacWeatherExtendedBlockSchema = z.object({
  key: z.string(),
  label: z.string(),
  part: z.string().nullable().optional(),
  date: z.string(),
})

/** A sensible-weather text slot as this issuance labels it ("Tonight", "Tomorrow"). */
export const nwacWeatherSensibleSlotSchema = z.object({
  key: z.string(),
  label: z.string(),
  period: z.string().nullable().optional(),
  date: z.string().nullable().optional(),
})

/** One section of the format's template: a grid the forecast has, and what it runs on. */
export const nwacWeatherSectionSchema = z.object({
  id: z.string(),
  grid: z.string(),
  /** The row list it runs down: `zones`, `points` or `extendedZones`. */
  rows: z.string(),
  /** The entry of `axes` it runs across. */
  axis: z.string(),
})

const keys = z.array(z.string())

/** The slot keys each grid covers, as the forecast was published. */
export const nwacWeatherAxesSchema = z.object({
  precipPeriods: keys,
  tempPeriods: keys,
  snowLevelBlocks: keys,
  windBlocks: keys,
  extendedBlocks: keys,
  sensibleSlots: keys,
})

export const nwacWeatherPrecipRowSchema = z.object({
  point: z.string(),
  period: z.string(),
  qpf: nullableNumber.optional(),
  density: nullableNumber.optional(),
})

export const nwacWeatherTempRowSchema = z.object({
  zone: z.string(),
  period: z.string(),
  high: nullableNumber.optional(),
  low: nullableNumber.optional(),
})

export const nwacWeatherWindRowSchema = z.object({
  zone: z.string(),
  block: z.string(),
  dir: z.string().nullable().optional(),
  speed: nullableNumber.optional(),
})

export const nwacWeatherLevelRowSchema = z.object({
  zone: z.string(),
  block: z.string(),
  freezing: nullableNumber.optional(),
  drop: nullableNumber.optional(),
  mode: z.string().nullable().optional(),
})

export const nwacWeatherSensibleRowSchema = z.object({
  zone: z.string(),
  slot: z.string(),
  text: z.string().nullable().optional(),
})

/** One published issuance. `available: false` is the empty answer and carries no forecast. */
export const nwacWeatherForecastSchema = z.object({
  available: z.literal(true),
  id: z.number(),
  issuedAt: z.string(),
  type: nwacWeatherIssuanceTypeSchema,
  serviceDate: z.string(),
  author: z.string().nullable(),
  /** Which template draws the forecast, e.g. `dashboard-v2-2026-09-01`. */
  format: z.string(),
  template: z.object({ label: z.string(), sections: z.array(nwacWeatherSectionSchema) }),
  /** The layout version the forecast was created under. */
  layout: z.object({ id: z.number().nullable(), name: z.string().nullable() }).optional(),
  synopsis: z.string().nullable(),
  extendedOutlook: z.string().nullable(),
  zones: z.array(nwacWeatherZoneSchema),
  points: z.array(nwacWeatherPointSchema),
  /** Ids of the zones that carry the extended snow-level outlook. */
  extendedZones: keys,
  periods: z.array(nwacWeatherPeriodSchema),
  blocks: z.array(nwacWeatherBlockSchema),
  extendedBlocks: z.array(nwacWeatherExtendedBlockSchema),
  sensibleSlots: z.array(nwacWeatherSensibleSlotSchema),
  axes: nwacWeatherAxesSchema,
  precip: z.array(nwacWeatherPrecipRowSchema),
  temp: z.array(nwacWeatherTempRowSchema),
  wind: z.array(nwacWeatherWindRowSchema),
  snowLevel: z.array(nwacWeatherLevelRowSchema),
  sensible: z.array(nwacWeatherSensibleRowSchema),
})
export type NWACWeatherForecastWire = z.infer<typeof nwacWeatherForecastSchema>

export const nwacWeatherUnavailableSchema = z.object({ available: z.literal(false) })

export const nwacWeatherForecastResponseSchema = z.union([
  nwacWeatherForecastSchema,
  nwacWeatherUnavailableSchema,
])

/** `/forecasts`: every issuance published for one forecast date, newest first. */
export const nwacWeatherForecastsResponseSchema = z.object({
  available: z.boolean(),
  serviceDate: z.string().nullable(),
  forecasts: z.array(nwacWeatherForecastSchema),
})
export type NWACWeatherForecastsWire = z.infer<typeof nwacWeatherForecastsResponseSchema>

/** `/forecast/archive`: one entry per published issuance in a date range. */
export const nwacWeatherArchiveSchema = z.array(z.object({ serviceDate: z.string() }))
