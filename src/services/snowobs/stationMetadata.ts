import { z } from 'zod'
import { SnowObsError } from './snowobs'

// A status note SnowObs attaches to a station (a dead gauge, a rime event). The
// legacy NAC widget shows these as a "Status Alert" popover; nothing in NWAC's
// source carries one today, so the field is parsed but rarely populated.
const snowObsStationNoteSchema = z.object({
  status: z.string().nullish(),
  note: z.string().nullish(),
  start_date: z.string().nullish(),
})

// The station registry as SnowObs holds it. Separate from the timeseries schema
// because that one deliberately strips `meta` -- the pages don't need it, but
// the sync does.
const stationMetadataSchema = z.object({
  stid: z.union([z.number(), z.string()]).transform((v) => String(v)),
  name: z.string().nullish(),
  latitude: z.number().nullish(),
  longitude: z.number().nullish(),
  elevation: z.number().nullish(),
  source: z.string().nullish(),
  meta: z
    .object({
      state: z.string().nullish(),
      weather_station_partner: z.string().nullish(),
    })
    .nullish(),
  station_note: z.array(snowObsStationNoteSchema).nullish(),
})

export type SnowObsStationMetadata = z.infer<typeof stationMetadataSchema>

const responseSchema = z.array(stationMetadataSchema)

const SNOWOBS_API = 'https://api.snowobs.com/wx/v1'

type MetadataOptions = {
  // Seconds for Next's fetch cache. Omit to bypass the cache (the sync wants
  // the current list, not one from an hour ago).
  revalidate?: number
}

/**
 * Every station SnowObs holds for a source -- including ones no page shows.
 *
 * SnowObs is the source of truth for what a station *is*: its id, name,
 * coordinates, elevation and partner. Which page shows it is NWAC's decision
 * and lives on the station row in Payload.
 */
export async function fetchStationMetadata(
  source: string,
  token: string,
  options: MetadataOptions = {},
): Promise<SnowObsStationMetadata[]> {
  const params = new URLSearchParams({ token, source })
  const url = `${SNOWOBS_API}/station/metadata/?${params.toString()}`

  let res: Response
  try {
    res =
      options.revalidate == null
        ? await fetch(url, { cache: 'no-store' })
        : await fetch(url, { next: { revalidate: options.revalidate } })
  } catch (error) {
    throw new SnowObsError('Failed to reach SnowObs station metadata', error, { source })
  }

  if (!res.ok) {
    throw new SnowObsError(`SnowObs station metadata returned ${res.status}`, undefined, {
      source,
      status: res.status,
    })
  }

  const parsed = responseSchema.safeParse(await res.json())
  if (!parsed.success) {
    throw new SnowObsError('Unexpected SnowObs station metadata shape', parsed.error, { source })
  }
  return parsed.data
}
