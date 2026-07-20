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

// Display-friendly unit labels keyed by the raw unit SnowObs returns in `UNITS`.
export const UNIT_LABELS: Record<string, string> = {
  fahrenheit: '°F',
  degrees: '°',
  inches: 'in',
  mph: 'mph',
  '%': '%',
  'W/m**2': 'W/m²',
  volt: 'V',
}

// Variable name of the computed running-total precipitation column.
export const PRECIP_HOURLY = 'precip_accum_one_hour'
export const PRECIP_CUMSUM = 'precip_cumsum'

export const DISPLAY_TIMEZONE = 'America/Vancouver'

// Derive a fallback header label the way the legacy plugin did: initials of the
// underscore/space-separated variable name, uppercased (e.g. "foo_bar" -> "FB").
export function fallbackSensorLabel(variable: string): string {
  const matches = variable.replace(/_/g, ' ').match(/\b(\w)/g)
  return matches ? matches.join('').toUpperCase() : variable
}

// Format a date in the display timezone and return a getter for individual parts
// (e.g. get('hour')). Shared by the table and CSV timestamp formatters.
export function zonedParts(
  date: Date,
  options: Intl.DateTimeFormatOptions,
): (type: string) => string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: DISPLAY_TIMEZONE,
    ...options,
  }).formatToParts(date)
  return (type) => parts.find((part) => part.type === type)?.value ?? ''
}
