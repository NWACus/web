import { tz } from '@date-fns/tz'
import { format } from 'date-fns'
import { displayUnit, NWAC_DISPLAY_TIMEZONE } from './constants'
import type { UnitSystem } from './metricUnits'
import { metricConversionFor } from './metricUnits'
import type { SnowObsTimeseriesResponse } from './types/schemas'

// Full Pacific-local timestamp (YYYY-MM-DD HH:mm) for a CSV row.
function formatCsvTimestamp(iso: string): string {
  return format(new Date(iso), 'yyyy-MM-dd HH:mm', { in: tz(NWAC_DISPLAY_TIMEZONE) })
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
 * window: a Pacific-local timestamp column followed by one column per sensor
 * (raw variable name + display unit in the header). Returns just the header row
 * when the station has no observations.
 */
export function buildStationCsv(
  response: SnowObsTimeseriesResponse,
  stid: string,
  units: UnitSystem = 'imperial',
): string {
  const observations = response.STATION.find((s) => s.stid === stid)?.observations ?? {}
  const times = observations['date_time'] ?? []
  const sensors = Object.keys(observations).filter((key) => key !== 'date_time')

  const header = [
    'Time (Pacific)',
    ...sensors.map((v) => sensorHeader(v, response.UNITS[v], units)),
  ]
  const rows = times.map((time, i) => [
    formatCsvTimestamp(String(time)),
    ...sensors.map((variable) => sensorValue(observations[variable]?.[i], units, variable)),
  ])
  return [header, ...rows].map(csvRow).join('\n')
}
