import { centerTimezone } from '@/utilities/tenancy/avalancheCenters'
import { tz } from '@date-fns/tz'
import { format } from 'date-fns'
import { displayUnit, timezoneAbbreviation } from './constants'
import type { UnitSystem } from './metricUnits'
import { metricConversionFor } from './metricUnits'
import type { StationRef } from './stationKey'
import { stationKey } from './stationKey'
import type { SnowObsTimeseriesResponse } from './types/schemas'

// Full center-local timestamp (YYYY-MM-DD HH:mm) for a CSV row.
function formatCsvTimestamp(iso: string, timeZone: string): string {
  return format(new Date(iso), 'yyyy-MM-dd HH:mm', { in: tz(timeZone) })
}

// Quote a CSV field only when it contains a comma, quote, or newline.
function csvField(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

function csvRow(fields: string[]): string {
  return fields.map(csvField).join(',')
}

function sensorHeader(variable: string, rawUnit: string | undefined, units: UnitSystem): string {
  const conversion = units === 'metric' ? metricConversionFor(variable) : null
  const unit = conversion ? conversion.unit : displayUnit(rawUnit)
  return unit ? `${variable} (${unit})` : variable
}

function sensorValue(
  value: string | number | null | undefined,
  units: UnitSystem,
  variable: string,
) {
  if (value === null || value === undefined) return ''
  if (units === 'imperial' || typeof value !== 'number') return String(value)
  const conversion = metricConversionFor(variable)
  return conversion ? String(Number(conversion.convert(value).toFixed(2))) : String(value)
}

/**
 * Build a CSV of every sensor a single datalogger reports over the fetched
 * window: a timestamp column in the center's timezone followed by one column
 * per sensor (raw variable name + display unit in the header). Returns just the
 * header row when the station has no observations.
 */
export function buildStationCsv(
  center: string,
  response: SnowObsTimeseriesResponse,
  station: StationRef,
  units: UnitSystem = 'imperial',
): string {
  const timeZone = centerTimezone(center)
  const key = stationKey(station)
  const observations = response.STATION.find((s) => stationKey(s) === key)?.observations ?? {}
  const times = observations['date_time'] ?? []
  const sensors = Object.keys(observations).filter((key) => key !== 'date_time')

  // The zone abbreviation is read off the first row so a winter download says
  // PST where a summer one says PDT; an empty file falls back to today's.
  const labelAt = times.length > 0 ? new Date(String(times[0])) : new Date()
  const header = [
    `Time (${timezoneAbbreviation(labelAt, timeZone)})`,
    ...sensors.map((v) => sensorHeader(v, response.UNITS[v], units)),
  ]
  const rows = times.map((time, i) => [
    formatCsvTimestamp(String(time), timeZone),
    ...sensors.map((variable) => sensorValue(observations[variable]?.[i], units, variable)),
  ])
  return [header, ...rows].map(csvRow).join('\n')
}
