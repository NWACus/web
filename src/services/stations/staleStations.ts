import type { StationRef } from '@/services/snowobs/stationKey'
import { stationKey } from '@/services/snowobs/stationKey'
import type { SnowObsTimeseriesResponse } from '@/services/snowobs/types/schemas'

/** A station with no readings in the range shown, but an earlier report. */
export type StaleStation = { name: string; lastReported: string }

export type LastDay = {
  station: StationRef
  observedAt: string
  response: SnowObsTimeseriesResponse
}

// Each stale station goes into the response with its readings emptied, so it keeps its columns and
// series but shows no values.
export function addStaleStations(
  response: SnowObsTimeseriesResponse,
  lastDays: LastDay[],
): { response: SnowObsTimeseriesResponse; stale: StaleStation[] } {
  const stale: StaleStation[] = []
  let merged = response
  for (const { station, observedAt, response: lastDay } of lastDays) {
    const key = stationKey(station)
    const found = lastDay.STATION.find((s) => stationKey(s) === key)
    if (!found) continue
    const known = new Set(merged.VARIABLES.map((v) => v.variable))
    merged = {
      ...merged,
      UNITS: { ...lastDay.UNITS, ...merged.UNITS },
      VARIABLES: [...merged.VARIABLES, ...lastDay.VARIABLES.filter((v) => !known.has(v.variable))],
      STATION: [
        ...merged.STATION.filter((s) => stationKey(s) !== key),
        {
          ...found,
          observations: Object.fromEntries(Object.keys(found.observations).map((k) => [k, []])),
        },
      ],
    }
    stale.push({ name: found.name ?? found.stid, lastReported: observedAt })
  }
  return { response: merged, stale }
}
