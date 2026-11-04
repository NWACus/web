import { resolveTablePeriod } from '@/components/WeatherStations/stationPeriods'
import { resolveSnowObsToken } from '@/services/snowobs/access'
import { readingsByStation } from '@/services/snowobs/deriveColumns'
import { fetchStationTimeseries } from '@/services/snowobs/snowobs'
import type { StationRef } from '@/services/snowobs/stationKey'
import { stationKey } from '@/services/snowobs/stationKey'
import { fetchCurrentObservations } from '@/services/snowobs/stationTracking'
import type { SnowObsTimeseriesResponse } from '@/services/snowobs/types/schemas'
import type { StationUnits } from '@/services/snowobs/units'
import { centerTimezone } from '@/utilities/tenancy/avalancheCenters'
import { subHours } from 'date-fns'
import type { LastDay } from './staleStations'
import { addStaleStations } from './staleStations'

export type StationReadings = {
  /** Each station's table readings, by `source:stid`. */
  readings: Record<string, string[]>
  /** When a silent station last reported, by `source:stid`. */
  lastReported: Record<string, string>
}

// A past day doesn't change; an hour matches the tracking feed that dates it.
const PAST_DAY_REVALIDATE = 3600

async function fetchLastDays(
  center: string,
  quiet: StationRef[],
  units?: StationUnits,
): Promise<LastDay[]> {
  const current = await fetchCurrentObservations(await resolveSnowObsToken(center))
  const lastDays = await Promise.all(
    quiet.map(async (station): Promise<LastDay | null> => {
      const observedAt = current.get(stationKey(station))?.observedAt
      if (!observedAt) return null
      const end = new Date(observedAt)
      // One station's old data failing shouldn't hide every other station's readings.
      const response = await fetchStationTimeseries(center, [station], {
        start: subHours(end, 24),
        end,
        units,
        revalidate: PAST_DAY_REVALIDATE,
      }).catch(() => null)
      return response && { station, observedAt, response }
    }),
  )
  return lastDays.filter((day) => day !== null)
}

// Battery counts here, though it's no table reading: a logger still sending it isn't down.
function silentStations(response: SnowObsTimeseriesResponse, stations: StationRef[]): StationRef[] {
  const reporting = new Set(
    response.STATION.filter((s) => Object.keys(s.observations).some((v) => v !== 'date_time')).map(
      stationKey,
    ),
  )
  return stations.filter((s) => !reporting.has(stationKey(s)))
}

/**
 * The readings the admin lists for a page's stations: the table's default view (same fetch, so it
 * shares the cache), or for a station with nothing in it, its last day.
 */
export async function fetchReportedReadings(
  center: string,
  stations: StationRef[],
): Promise<StationReadings> {
  const response = await fetchStationTimeseries(center, stations, {
    windowHours: resolveTablePeriod(undefined).hoursBack(new Date(), centerTimezone(center)),
    revalidate: 60,
  })
  const readings = readingsByStation(response, stations)
  const quiet = stations.filter((s) => readings[stationKey(s)].length === 0)
  if (quiet.length === 0) return { readings, lastReported: {} }

  const lastReported: Record<string, string> = {}
  for (const { station, observedAt, response: lastDay } of await fetchLastDays(center, quiet)) {
    readings[stationKey(station)] = readingsByStation(lastDay, [station])[stationKey(station)]
    lastReported[stationKey(station)] = observedAt
  }
  return { readings, lastReported }
}

// If the lookup fails the stations stay out, as the readings themselves still load.
export async function withStaleStations(
  center: string,
  response: SnowObsTimeseriesResponse,
  stations: StationRef[],
  units?: StationUnits,
): Promise<{ response: SnowObsTimeseriesResponse; stale: string[] }> {
  const silent = silentStations(response, stations)
  if (silent.length === 0) return { response, stale: [] }
  const lastDays = await fetchLastDays(center, silent, units).catch(() => [])
  return addStaleStations(response, lastDays)
}

async function lastReportsOf(
  center: string,
  stations: StationRef[],
): Promise<Record<string, string>> {
  const response = await fetchStationTimeseries(center, stations, {
    windowHours: resolveTablePeriod(undefined).hoursBack(new Date(), centerTimezone(center)),
    units: 'default',
    revalidate: 60,
  })
  const silent = silentStations(response, stations)
  if (silent.length === 0) return {}
  const current = await fetchCurrentObservations(await resolveSnowObsToken(center))
  return Object.fromEntries(
    silent.flatMap((station) => {
      const observedAt = current.get(stationKey(station))?.observedAt
      return observedAt ? [[stationKey(station), observedAt]] : []
    }),
  )
}

// When each station silent over the table's default window last reported, by `source:stid`. The
// same fetch as that table, so they share the cache; a failure only leaves the page without it.
export function fetchLastReports(
  center: string,
  stations: StationRef[],
): Promise<Record<string, string>> {
  return lastReportsOf(center, stations).catch(() => ({}))
}
