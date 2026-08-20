import { z } from 'zod'

// A single sensor series or the date_time series. date_time values are ISO-UTC
// strings (e.g. "2026-07-07T00:00:00Z"); sensor series are numbers or null.
const observationSeriesSchema = z.array(z.union([z.number(), z.string(), z.null()]))

export const snowObsObservationsSchema = z.record(z.string(), observationSeriesSchema)
export type SnowObsObservations = z.infer<typeof snowObsObservationsSchema>

// Sensor caveats SnowObs carries per station, maintained by NWAC techs.
// `active` marks a current issue ("the precipitation gauge is not recording
// correctly"); `static` marks a permanent characteristic (unheated wind gauges
// that rime). Unknown statuses pass through rather than failing the response.
export const snowObsStationNoteSchema = z.object({
  status: z.string().nullish(),
  note: z.string().nullish(),
  start_date: z.string().nullish(),
  end_date: z.string().nullish(),
})

export const snowObsStationSchema = z.object({
  // SnowObs returns stid as a string, but coerce defensively so both a string
  // "4" and a numeric 4 normalize to the string form the config keys on.
  id: z.union([z.number(), z.string()]).transform((v) => String(v)),
  stid: z.union([z.number(), z.string()]).transform((v) => String(v)),
  name: z.string().nullish(),
  latitude: z.number().nullish(),
  longitude: z.number().nullish(),
  elevation: z.number().nullish(),
  observations: z.preprocess(
    (value) => (value == null || Array.isArray(value) ? {} : value),
    snowObsObservationsSchema,
  ),
  station_note: z.array(snowObsStationNoteSchema).nullish(),
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
