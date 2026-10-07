import { startOfDay, subMonths } from 'date-fns'
import { fetchStationTimeseries } from './snowobs'
import type { StationRef } from './stationKey'
import type { SnowObsTimeseriesResponse } from './types/schemas'

const LOOKBACK_MONTHS = 24
const ONE_DAY_SECONDS = 24 * 60 * 60

// The newest timestamp any station in the response reported, in ms.
export function latestObservationTime(response: SnowObsTimeseriesResponse): number | null {
  const times = response.STATION.flatMap((station) => station.observations['date_time'] ?? [])
    .map((iso) => (typeof iso === 'string' ? new Date(iso).getTime() : NaN))
    .filter(Number.isFinite)
  return times.length > 0 ? Math.max(...times) : null
}

// When a retired station last reported, walking back a month at a time so no
// single request is large. Windows are anchored to the day, so each month's
// URL stays stable and its response is cached for a day.
export async function fetchLastReported(
  center: string,
  stations: StationRef[],
  now = new Date(),
): Promise<Date | null> {
  const anchor = startOfDay(now)
  for (let monthsBack = 0; monthsBack < LOOKBACK_MONTHS; monthsBack++) {
    let response: SnowObsTimeseriesResponse
    try {
      response = await fetchStationTimeseries(center, stations, {
        start: subMonths(anchor, monthsBack + 1),
        end: subMonths(anchor, monthsBack),
        revalidate: ONE_DAY_SECONDS,
      })
    } catch {
      return null
    }
    const latest = latestObservationTime(response)
    if (latest !== null) return new Date(latest)
  }
  return null
}
