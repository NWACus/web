/**
 * Zod schemas for products-api's public NWAC weather reads (`/v3/public/nwac-weather/…`), as
 * sent: flat rows with calendar dates already resolved.
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
  /** Whether the issuance forecasts precipitation for this period. */
  precip: z.boolean().optional(),
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

// Measurement rows: products-api emits every value key on every row, null
// where the forecaster left it blank, so the keys are required. A row that
// lacks one is a wire mismatch (a renamed field, an older server) and should
// fail here, loudly, rather than read as a forecast of nothing.
export const nwacWeatherPrecipRowSchema = z.object({
  point: z.string(),
  period: z.string(),
  qpf: nullableNumber,
  slr: nullableNumber,
})

export const nwacWeatherTempRowSchema = z.object({
  zone: z.string(),
  period: z.string(),
  high: nullableNumber,
  low: nullableNumber,
})

export const nwacWeatherWindRowSchema = z.object({
  zone: z.string(),
  block: z.string(),
  dir: z.string().nullable(),
  speed: nullableNumber,
})

export const nwacWeatherLevelRowSchema = z.object({
  zone: z.string(),
  block: z.string(),
  freezing: nullableNumber,
  mode: z.string().nullable(),
})

export const nwacWeatherSensibleRowSchema = z.object({
  zone: z.string(),
  slot: z.string(),
  text: z.string().nullable(),
})

/** One published issuance. `available: false` is the empty answer and carries no forecast. */
export const nwacWeatherForecastSchema = z.object({
  available: z.literal(true),
  id: z.number(),
  issuedAt: z.string(),
  type: nwacWeatherIssuanceTypeSchema,
  serviceDate: z.string(),
  author: z.string().nullable(),
  synopsis: z.string().nullable(),
  extendedOutlook: z.string().nullable(),
  zones: z.array(nwacWeatherZoneSchema),
  points: z.array(nwacWeatherPointSchema),
  periods: z.array(nwacWeatherPeriodSchema),
  blocks: z.array(nwacWeatherBlockSchema),
  extendedBlocks: z.array(nwacWeatherExtendedBlockSchema),
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
