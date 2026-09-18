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
  /** Variables in the station's latest observation; empty when it has none. */
  variables: string[]
  /** When that observation was taken (ISO), or null when it has none. */
  observedAt: string | null
}

const responseSchema = z.array(trackedStationSchema)

// The list changes when a forecaster edits it in SnowObs, which is rare; an
// hour of staleness in the admin picker is fine.
export const TRACKING_REVALIDATE_SECONDS = 3600

// One client-scoped SnowObs read, cached an hour. 204 is SnowObs for "this
// client tracks nothing", so it comes back as `null` rather than a parse error.
async function readClientFeed<S extends z.ZodTypeAny>(
  path: string,
  token: string,
  schema: S,
  what: string,
): Promise<z.output<S> | null> {
  const params = new URLSearchParams({ token })
  const url = `${SNOWOBS_API}/${path}?${params.toString()}`

  let res: Response
  try {
    res = await fetch(url, { next: { revalidate: TRACKING_REVALIDATE_SECONDS } })
  } catch (error) {
    throw new SnowObsError(`Failed to reach SnowObs ${what}`, error)
  }
  if (res.status === 204) return null
  if (!res.ok) {
    throw new SnowObsError(`SnowObs ${what} returned ${res.status}`, undefined, {
      status: res.status,
    })
  }
  const parsed = schema.safeParse(await res.json())
  if (!parsed.success) {
    throw new SnowObsError(`Unexpected SnowObs ${what} shape`, parsed.error)
  }
  return parsed.data
}

export async function fetchTrackedStations(token: string): Promise<TrackedStation[]> {
  const stations = await readClientFeed(
    'station/tracking/',
    token,
    responseSchema,
    'station tracking',
  )
  return (stations ?? []).map((s) => ({
    stid: s.stid,
    source: s.source,
    name: s.name ?? null,
    elevation: s.elevation ?? null,
    partner: s.meta?.weather_station_partner ?? null,
    variables: [],
    observedAt: null,
  }))
}

// `station/data/current/` returns every tracked station with its latest
// observation, so its keys say which sensors each station has. One call for
// the whole client, ~130 KB for NWAC.
const currentSchema = z.object({
  STATION: z.array(
    z.object({
      stid: z.union([z.number(), z.string()]).transform((v) => String(v)),
      source: z.string().nullish(),
      observations: z.array(z.record(z.string(), z.unknown())).nullish(),
    }),
  ),
})

export type CurrentObservation = { variables: string[]; observedAt: string | null }
export type CurrentObservations = Map<string, CurrentObservation>

function latestObservation(observations: Record<string, unknown>[]): CurrentObservation {
  const variables = Array.from(new Set(observations.flatMap((o) => Object.keys(o)))).filter(
    (k) => k !== 'date_time',
  )
  const times = observations
    .map((o) => o.date_time)
    .filter((t): t is string => typeof t === 'string')
    .sort()
  return { variables, observedAt: times.at(-1) ?? null }
}

function stationKey(source: string | null | undefined, stid: string): string {
  return `${source ?? ''}:${stid}`
}

export async function fetchCurrentObservations(token: string): Promise<CurrentObservations> {
  const current = await readClientFeed(
    'station/data/current/',
    token,
    currentSchema,
    'current observations',
  )
  return new Map(
    (current?.STATION ?? []).map((s) => [
      stationKey(s.source, s.stid),
      latestObservation(s.observations ?? []),
    ]),
  )
}

// Pure so it can be tested: each tracked station gets what its current
// observation reports and when, or nothing.
export function withCurrentObservations(
  stations: TrackedStation[],
  current: CurrentObservations,
): TrackedStation[] {
  return stations.map((s) => ({
    ...s,
    ...(current.get(stationKey(s.source, s.stid)) ?? { variables: [], observedAt: null }),
  }))
}
