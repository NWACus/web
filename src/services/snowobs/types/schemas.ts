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

// --- Current conditions (the station map) ---------------------------------------------------

// A station's most recent reading per sensor, plus the `date_time` it was taken. Values are
// numbers (SnowObs rounds them unless `raw_data` is set); `date_time` is an ISO-UTC string.
const currentDataSchema = z.record(z.string(), z.union([z.number(), z.string(), z.null()]))

export const snowObsCurrentFeatureSchema = z.object({
  type: z.literal('Feature'),
  properties: z.object({
    id: z.string(),
    stid: z.union([z.number(), z.string()]).transform((v) => String(v)),
    name: z.string().nullish(),
    latitude: z.number().nullish(),
    longitude: z.number().nullish(),
    elevation: z.number().nullish(),
    timezone: z.string().nullish(),
    source: z.string(),
    data: z.preprocess(
      (value) => (value == null || Array.isArray(value) ? {} : value),
      currentDataSchema,
    ),
  }),
  geometry: z
    .object({
      type: z.literal('Point'),
      coordinates: z.array(z.number()).min(2),
    })
    .nullish(),
})

// `GET /wx/v1/station/data/current/` with `accept: application/vnd.geo+json` — one feature per
// station the token tracks, across every source the center enabled, plus the variable names and
// units the readings are in.
export const snowObsCurrentGeojsonSchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(snowObsCurrentFeatureSchema),
  properties: z.object({
    variables: z.array(snowObsVariableSchema),
    units: z.record(z.string(), z.string()),
  }),
})
export type SnowObsCurrentGeojson = z.infer<typeof snowObsCurrentGeojsonSchema>

// --- Webcams ----------------------------------------------------------------------------------

export const snowObsWebcamImageSchema = z.object({
  id: z.number(),
  image_title: z.string().nullish(),
  // 'image' (a JPG/PNG URL), 'youtube' (a watch URL) or 'url' (a link out to a third-party page).
  image_type: z.string(),
  image_source: z.string().nullish(),
})

export const snowObsWebcamSchema = z.object({
  id: z.number(),
  webcam_title: z.string().nullish(),
  webcam_image: z.array(snowObsWebcamImageSchema).default([]),
  location: z
    .object({
      geometry: z
        .object({
          type: z.literal('Point'),
          coordinates: z.array(z.number()).min(2),
        })
        .nullish(),
    })
    .nullish(),
})

// `GET /v1/webcam?token=…` — the center's webcams, nested under `webcam`.
export const snowObsWebcamResponseSchema = z.object({
  webcam: z.array(snowObsWebcamSchema).default([]),
})
export type SnowObsWebcamResponse = z.infer<typeof snowObsWebcamResponseSchema>
