import { resolveTablePeriod } from '@/components/WeatherStations/stationPeriods'
import { resolveSnowObsToken } from '@/services/snowobs/access'
import { readingsByStation } from '@/services/snowobs/deriveColumns'
import { fetchStationTimeseries } from '@/services/snowobs/snowobs'
import type { StationRef } from '@/services/snowobs/stationKey'
import { stationKey } from '@/services/snowobs/stationKey'
import { fetchCurrentObservations } from '@/services/snowobs/stationTracking'
import { centerTimezone } from '@/utilities/tenancy/avalancheCenters'
import { subHours } from 'date-fns'

export type StationReadings = {
  /** Each station's table readings, by `source:stid`. */
  readings: Record<string, string[]>
  /** When a recently silent station last reported, by `source:stid`. */
  lastReported: Record<string, string>
}

// A past day doesn't change; an hour matches the tracking feed that dates it.
const PAST_DAY_REVALIDATE = 3600
// Long enough for a once-a-day station between reports; a station quiet longer is down, and lists
// nothing until it reports again.
const RECENT_REPORT_HOURS = 48

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
  const quiet = stations.filter((s) => readings[stationKey(s)].length === 0)
  if (quiet.length === 0) return { readings, lastReported: {} }

  const current = await fetchCurrentObservations(await resolveSnowObsToken(center))
  const lastReported: Record<string, string> = {}
  await Promise.all(
    quiet.map(async (station) => {
      const observedAt = current.get(stationKey(station))?.observedAt
      if (!observedAt) return
      const end = new Date(observedAt)
      if (end < subHours(new Date(), RECENT_REPORT_HOURS)) return
      // One station's old data failing shouldn't hide every other station's readings.
      const lastDay = await fetchStationTimeseries(center, [station], {
        start: subHours(end, 24),
        end,
        revalidate: PAST_DAY_REVALIDATE,
      }).catch(() => null)
      if (!lastDay) return
      readings[stationKey(station)] = readingsByStation(lastDay, [station])[stationKey(station)]
      lastReported[stationKey(station)] = observedAt
    }),
  )
  return { readings, lastReported }
}
