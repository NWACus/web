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
  // A station with no data comes back as [] (and defensively null/missing)
  // instead of {}; normalize any of those to an empty observations object.
  observations: z.preprocess(
    (value) => (value == null || Array.isArray(value) ? {} : value),
    snowObsObservationsSchema,
  ),
})

export const snowObsVariableSchema = z.object({
  variable: z.string(),
  long_name: z.string(),
})

export const snowObsTimeseriesResponseSchema = z.object({
  UNITS: z.record(z.string(), z.string()),
  VARIABLES: z.array(snowObsVariableSchema),
  STATION: z.array(snowObsStationSchema),
})
export type SnowObsTimeseriesResponse = z.infer<typeof snowObsTimeseriesResponseSchema>
