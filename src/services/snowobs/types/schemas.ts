import { z } from 'zod'

// A single sensor series or the date_time series. date_time values are ISO-UTC
// strings (e.g. "2026-07-07T00:00:00Z"); sensor series are numbers or null.
const observationSeriesSchema = z.array(z.union([z.number(), z.string(), z.null()]))

export const snowObsObservationsSchema = z.record(z.string(), observationSeriesSchema)
export type SnowObsObservations = z.infer<typeof snowObsObservationsSchema>

export const snowObsStationSchema = z.object({
  // SnowObs returns stid as a string, but coerce defensively so both a string
  // "4" and a numeric 4 normalize to the string form the config keys on.
  id: z.union([z.number(), z.string()]).transform((v) => String(v)),
  stid: z.union([z.number(), z.string()]).transform((v) => String(v)),
  name: z.string().nullish(),
  latitude: z.number().nullish(),
  longitude: z.number().nullish(),
  elevation: z.number().nullish(),
  timezone: z.string().nullish(),
  observations: snowObsObservationsSchema,
})
export type SnowObsStation = z.infer<typeof snowObsStationSchema>

export const snowObsVariableSchema = z.object({
  variable: z.string(),
  long_name: z.string(),
})
export type SnowObsVariable = z.infer<typeof snowObsVariableSchema>

export const snowObsTimeseriesResponseSchema = z.object({
  UNITS: z.record(z.string(), z.string()),
  VARIABLES: z.array(snowObsVariableSchema),
  STATION: z.array(snowObsStationSchema),
})
export type SnowObsTimeseriesResponse = z.infer<typeof snowObsTimeseriesResponseSchema>
