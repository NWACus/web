// Short column-header labels per SnowObs variable, ported from the legacy
// nwac_weatherstation plugin's variable_map so forecasters see familiar headers.
export const SENSOR_LABELS: Record<string, string> = {
  elevation: 'Elev',
  air_temp: 'Temp',
  relative_humidity: 'RH',
  dew_point_temperature: 'DewP',
  wind_speed: 'Spd',
  wind_speed_min: 'Min',
  wind_gust: 'Gust',
  wind_direction: 'Dir',
  precip_accum_one_hour: 'Pcp1',
  precip_accum_24hr: 'Pcp24',
  precip_cumsum: 'PcpSum',
  precip_accum: 'PcpAc',
  snow_water_equiv_24hr: 'SWE24',
  snow_water_equiv: 'SWE',
  snow_depth_24hr: 'SnoHt24',
  snow_depth_24h: '24Sno',
  snow_depth: 'SnoHt',
  intermittent_snow: 'I/S_Sno',
  pressure: 'Pres',
  equip_temperature: 'EqTemp',
}

// Full names for the admin's reading picker; SnowObs's own long names arrive only with a timeseries.
export const READING_NAMES: Record<string, string> = {
  air_temp: 'Air temperature',
  relative_humidity: 'Relative humidity',
  wind_speed_min: 'Wind speed minimum',
  wind_speed: 'Wind speed',
  wind_gust: 'Wind gust',
  wind_direction: 'Wind direction',
  precip_accum_one_hour: 'Hourly precipitation',
  snow_depth_24h: '24-hour snowfall',
  snow_depth: 'Snow depth',
  intermittent_snow: 'Intermittent snow',
  solar_radiation: 'Solar radiation',
  pressure: 'Barometric pressure',
  equip_temperature: 'Equipment temperature',
}

// Display-friendly unit labels keyed by the raw unit SnowObs returns in `UNITS`.
export const UNIT_LABELS: Record<string, string> = {
  fahrenheit: '°F',
  celsius: '°C',
  degrees: '°',
  inches: 'in',
  centimeters: 'cm',
  millimeters: 'mm',
  mph: 'mph',
  'm/s': 'm/s',
  // No center reports metric wind in km/h yet, so SnowObs's name for it is a guess.
  kph: 'km/h',
  'km/hr': 'km/h',
  '%': '%',
  'W/m**2': 'W/m²',
  'MJ/m**2': 'MJ/m²',
  volt: 'V',
  volts: 'V',
  inch_Hg: 'inHg',
  millibar: 'mbar',
  pascals: 'Pa',
}

export function displayUnit(rawUnit: string | undefined): string {
  if (!rawUnit) return ''
  return UNIT_LABELS[rawUnit] ?? rawUnit
}

// The hourly precip variable SnowObs reports, and the running-total column the
// table computes from it (not fetched from SnowObs).
export const PRECIP_HOURLY = 'precip_accum_one_hour'
export const PRECIP_CUMSUM = 'precip_cumsum'

// Derive a fallback header label the way the legacy plugin did: initials of the
// underscore/space-separated variable name, uppercased (e.g. "foo_bar" -> "FB").
export function fallbackSensorLabel(variable: string): string {
  const matches = variable.replace(/_/g, ' ').match(/\b(\w)/g)
  return matches ? matches.join('').toUpperCase() : variable
}

// Format a date in a zone and return a getter for individual parts (e.g.
// get('timeZoneName') -> "PDT") — Intl is the only way to get the zone
// abbreviation, which date-fns `format` can't produce.
export function zonedParts(
  date: Date,
  timeZone: string,
  options: Intl.DateTimeFormatOptions,
): (type: string) => string {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, ...options }).formatToParts(date)
  return (type) => parts.find((part) => part.type === type)?.value ?? ''
}

// The zone abbreviation a center's readers expect, e.g. "PDT" or "MST".
export function timezoneAbbreviation(date: Date, timeZone: string): string {
  return zonedParts(date, timeZone, { timeZoneName: 'short' })('timeZoneName')
}

// Left-to-right order of readings in a station table. Variable-major, the way
// the legacy nwac.us tables read: every logger's temperature, then every
// logger's humidity, and so on down the list. A reading SnowObs starts sending
// that isn't listed here lands after these, alphabetically.
export const TABLE_VARIABLE_ORDER = [
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
