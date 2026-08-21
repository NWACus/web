import { NWAC_WEATHER_STATION_GROUPS } from '@/constants/weatherStations'
import {
  BATTERY_THRESHOLDS,
  BATTERY_VOLTAGE,
  BatteryThresholds,
  evaluateStation,
  readingsFor,
  StationBattery,
} from './batteryEvaluation'
import { fetchStationTimeseries } from './snowobs'

export * from './batteryEvaluation'

/**
 * Groups are the only station list we have until #1169 turns the registry into
 * data, so a station in SnowObs but in no group is invisible here -- which
 * matches what the pages show.
 */
export function monitoredStids(): string[] {
  return Array.from(new Set(NWAC_WEATHER_STATION_GROUPS.flatMap((group) => group.stids)))
}

export async function scanBatteries(
  thresholds: BatteryThresholds = BATTERY_THRESHOLDS,
  now: number = Date.now(),
): Promise<StationBattery[]> {
  const stids = monitoredStids()
  // Enough history for the debounce, plus slack for irregular reporting.
  const windowHours = Math.max(thresholds.staleHours, thresholds.consecutive + 3)
  const response = await fetchStationTimeseries(stids, {
    windowHours,
    // Alerting must see the current reading, not a cached one from the page's
    // 10-minute ISR bucket.
    revalidate: 60,
  })

  return response.STATION.map((station) =>
    evaluateStation(
      station,
      readingsFor(station.observations.date_time, station.observations[BATTERY_VOLTAGE]),
      thresholds,
      now,
    ),
  ).sort((a, b) => a.name.localeCompare(b.name))
}
