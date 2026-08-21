import { z } from 'zod'
import { SnowObsError } from './snowobs'

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
})

export type SnowObsStationMetadata = z.infer<typeof stationMetadataSchema>

const responseSchema = z.array(stationMetadataSchema)

const SNOWOBS_API = 'https://api.snowobs.com/wx/v1'

/**
 * Every station SnowObs holds for a source -- including ones no page shows.
 * Alerting wants the full set: a logger nobody has put on a page can still have
 * a dying battery, and is less likely to be noticed failing.
 */
export async function fetchStationMetadata(
  source: string,
  token: string,
): Promise<SnowObsStationMetadata[]> {
  const params = new URLSearchParams({ token, source })
  const url = `${SNOWOBS_API}/station/metadata/?${params.toString()}`

  let res: Response
  try {
    res = await fetch(url, { cache: 'no-store' })
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
