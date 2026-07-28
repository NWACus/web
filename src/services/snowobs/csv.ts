import { tz } from '@date-fns/tz'
import { format } from 'date-fns'
import { NWAC_DISPLAY_TIMEZONE, UNIT_LABELS } from './constants'
import type { SnowObsTimeseriesResponse } from './types/schemas'

// Full Pacific-local timestamp (YYYY-MM-DD HH:mm) for a CSV row.
function formatCsvTimestamp(iso: string): string {
  return format(new Date(iso), 'yyyy-MM-dd HH:mm', { in: tz(NWAC_DISPLAY_TIMEZONE) })
}

// Quote a CSV field only when it contains a comma, quote, or newline.
function csvField(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

/**
 * Build a CSV of every sensor a single datalogger reports over the fetched
 * window: a Pacific-local timestamp column followed by one column per sensor
 * (raw variable name + display unit in the header). Returns just the header row
 * when the station has no observations.
 */
// CRAP is inflated by the lack of unit coverage on this builder.
// fallow-ignore-next-line complexity
export function buildStationCsv(response: SnowObsTimeseriesResponse, stid: string): string {
  const station = response.STATION.find((s) => s.stid === stid)
  const observations = station?.observations ?? {}
  const rawTimes = observations['date_time']
  const times = Array.isArray(rawTimes) ? rawTimes : []
  const sensors = Object.keys(observations).filter((key) => key !== 'date_time')

  const header = [
    'Time (Pacific)',
    ...sensors.map((variable) => {
      const rawUnit = response.UNITS[variable]
      const unit = rawUnit ? (UNIT_LABELS[rawUnit] ?? rawUnit) : ''
      return unit ? `${variable} (${unit})` : variable
    }),
  ]

  const lines = [header.map(csvField).join(',')]
  for (let i = 0; i < times.length; i++) {
    const time = times[i]
    const row = [
      formatCsvTimestamp(typeof time === 'string' ? time : String(time)),
      ...sensors.map((variable) => {
        const value = observations[variable]?.[i]
        return value === null || value === undefined ? '' : String(value)
      }),
    ]
    lines.push(row.map((field) => csvField(field)).join(','))
  }
  return lines.join('\n')
}
