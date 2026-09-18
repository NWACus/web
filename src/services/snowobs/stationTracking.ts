import { z } from 'zod'
import { SNOWOBS_API, SnowObsError } from './access'

// The stations a center's forecasters have curated in SnowObs, across every
// source the center uses (NWAC: its own loggers plus SNOTEL and Mesowest).
// `station/tracking/` is scoped by the token's client, not by source; passing
// `source` narrows it, which is never what the picker wants.
const trackedStationSchema = z.object({
  stid: z.union([z.number(), z.string()]).transform((v) => String(v)),
  source: z.string(),
  name: z.string().nullish(),
  latitude: z.number().nullish(),
  longitude: z.number().nullish(),
  elevation: z.number().nullish(),
  meta: z.object({ weather_station_partner: z.string().nullish() }).nullish(),
})

export type TrackedStation = {
  stid: string
  source: string
  name: string | null
  elevation: number | null
  partner: string | null
}

const responseSchema = z.array(trackedStationSchema)

// The list changes when a forecaster edits it in SnowObs, which is rare; an
// hour of staleness in the admin picker is fine.
export const TRACKING_REVALIDATE_SECONDS = 3600

export async function fetchTrackedStations(token: string): Promise<TrackedStation[]> {
  const params = new URLSearchParams({ token })
  const url = `${SNOWOBS_API}/station/tracking/?${params.toString()}`

  let res: Response
  try {
    res = await fetch(url, { next: { revalidate: TRACKING_REVALIDATE_SECONDS } })
  } catch (error) {
    throw new SnowObsError('Failed to reach SnowObs station tracking', error)
  }
  // 204 is SnowObs for "this client tracks nothing".
  if (res.status === 204) return []
  if (!res.ok) {
    throw new SnowObsError(`SnowObs station tracking returned ${res.status}`, undefined, {
      status: res.status,
    })
  }

  const parsed = responseSchema.safeParse(await res.json())
  if (!parsed.success) {
    throw new SnowObsError('Unexpected SnowObs station tracking shape', parsed.error)
  }
  return parsed.data.map((s) => ({
    stid: s.stid,
    source: s.source,
    name: s.name ?? null,
    elevation: s.elevation ?? null,
    partner: s.meta?.weather_station_partner ?? null,
  }))
}
