/**
 * The vocabulary of readings a station table can show.
 *
 * The order here is the order a new page's columns default to, and the order the
 * admin lists them in. It is not binding: each group stores its own ordered
 * column rows, because a handful of pages deviate deliberately -- Mt Washington
 * puts wind direction before humidity.
 */
export const COLUMN_VARIABLE_ORDER = [
  'air_temp',
  'relative_humidity',
  'wind_speed_min',
  'wind_speed',
  'wind_gust',
  'wind_direction',
  'precip_accum_one_hour',
  'snow_depth_24h',
  'snow_depth',
  'intermittent_snow',
  'solar_radiation',
  'pressure',
  'equip_temperature',
] as const

export type ColumnVariable = (typeof COLUMN_VARIABLE_ORDER)[number]

export const COLUMN_VARIABLE_LABELS: Record<ColumnVariable, string> = {
  air_temp: 'Air temperature',
  relative_humidity: 'Relative humidity',
  wind_speed_min: 'Wind speed (min)',
  wind_speed: 'Wind speed',
  wind_gust: 'Wind gust',
  wind_direction: 'Wind direction',
  precip_accum_one_hour: 'Precipitation (1 hr)',
  snow_depth_24h: 'Snow depth (24 hr)',
  snow_depth: 'Snow depth',
  intermittent_snow: 'Intermittent snow',
  solar_radiation: 'Solar radiation',
  pressure: 'Pressure',
  equip_temperature: 'Equipment temperature',
}

export const COLUMN_VARIABLE_OPTIONS = COLUMN_VARIABLE_ORDER.map((value) => ({
  label: COLUMN_VARIABLE_LABELS[value],
  value,
}))

type ColumnRow = {
  variable?: string | null
  stations?: (number | { stid?: string | null })[] | null
}

/**
 * Flatten a group's stored column rows into the table header, left to right.
 *
 * Each row is one reading and the loggers reporting it, so a page that shows
 * temperature at three elevations is one row rather than three. Needs the
 * stations populated (`depth >= 1`); unpopulated ids are skipped rather than
 * throwing, so a deleted station costs its column and not the page.
 */
export function columnsFor(rows?: ColumnRow[] | null): { stid: string; variable: string }[] {
  return (rows ?? []).flatMap((row) => {
    const variable = row.variable
    if (!variable) return []
    return (row.stations ?? []).flatMap((station) => {
      if (typeof station !== 'object' || !station.stid) return []
      return [{ stid: station.stid, variable }]
    })
  })
}
