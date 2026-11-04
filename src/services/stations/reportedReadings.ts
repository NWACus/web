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
import type { LastDay, StaleStation } from './staleStations'
import { addStaleStations } from './staleStations'

export type StationReadings = {
  /** Each station's table readings, by `source:stid`. */
  readings: Record<string, string[]>
  /** When a recently silent station last reported, by `source:stid`. */
  lastReported: Record<string, string>
}

// A past day doesn't change; an hour matches the tracking feed that dates it.
const PAST_DAY_REVALIDATE = 3600
// Long enough for a once-a-day station between reports; a station quiet longer is down, and shows
// nothing until it reports again.
const RECENT_REPORT_HOURS = 48

// The last day of each quiet station that reported recently.
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
      if (end < subHours(new Date(), RECENT_REPORT_HOURS)) return null
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

function quietStations(response: SnowObsTimeseriesResponse, stations: StationRef[]): StationRef[] {
  const readings = readingsByStation(response, stations)
  return stations.filter((s) => readings[stationKey(s)].length === 0)
}

/**
 * The readings the admin lists for a page's stations: the table's default view (same fetch, so it
 * shares the cache), or for a station that reported recently but not in it, its last day.
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
  const quiet = quietStations(response, stations)
  if (quiet.length === 0) return { readings, lastReported: {} }

  const lastReported: Record<string, string> = {}
  for (const { station, observedAt, response: lastDay } of await fetchLastDays(center, quiet)) {
    readings[stationKey(station)] = readingsByStation(lastDay, [station])[stationKey(station)]
    lastReported[stationKey(station)] = observedAt
  }
  return { readings, lastReported }
}

/**
 * A response for a range reaching now, with any station that is quiet in it but reported recently
 * kept as stale. If the lookup fails the stations stay out, as the readings themselves still load.
 */
export async function withStaleStations(
  center: string,
  response: SnowObsTimeseriesResponse,
  stations: StationRef[],
  units?: StationUnits,
): Promise<{ response: SnowObsTimeseriesResponse; stale: StaleStation[] }> {
  const quiet = quietStations(response, stations)
  if (quiet.length === 0) return { response, stale: [] }
  const lastDays = await fetchLastDays(center, quiet, units).catch(() => [])
  return addStaleStations(response, lastDays)
}
