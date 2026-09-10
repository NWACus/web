/**
 * How a station's readings are named, ordered and formatted on the map.
 *
 * Ported from the legacy stations widget (`apps/stations/utils/station.js` and the info-window
 * components) so a reader sees the same labels, order and compass points as in the embed.
 */

/**
 * The display order of variables in a station's card, and the label each gets. Sensors a station
 * reports that aren't listed here follow, in the order SnowObs sent them.
 */
export const VARIABLE_ORDER: string[] = [
  'station',
  'elevation',
  'date_time',
  'air_temp',
  'relative_humidity',
  'dew_point_temperature',
  'wind_speed_min',
  'wind_speed',
  'wind_gust',
  'wind_direction',
  'precip_accum_one_hour',
  'precip_accum_one_hour_total',
  'precip_accum',
  'precip_accum_24hr',
  'snow_water_equiv',
  'snow_water_equiv_24hr',
  'snow_depth_24h',
  'snow_depth',
  'snow_depth_24hr',
  'intermittent_snow',
  'pressure',
  'equip_temperature',
]

/** Reorder `variables` to `VARIABLE_ORDER`, keeping unlisted ones at the end in their own order. */
export function orderVariables(variables: string[]): string[] {
  const present = new Set(variables.filter((v) => v !== 'date_time'))
  const ordered = VARIABLE_ORDER.filter((v) => present.has(v))
  const rest = variables.filter((v) => v !== 'date_time' && !VARIABLE_ORDER.includes(v))
  return [...ordered, ...rest]
}

/** The widget's abbreviations of SnowObs' unit names, for card rows and marker labels. */
const SHORT_UNITS: Record<string, string> = {
  inches: 'in',
  fahrenheit: 'F',
  degrees: 'deg',
  millibar: 'mbar',
  'W/m**2': 'W/m2',
  celsius: 'C',
  millimeters: 'mm',
}

export function shortUnit(rawUnit: string | undefined): string {
  if (!rawUnit) return ''
  return SHORT_UNITS[rawUnit] ?? rawUnit
}

/** The widget's shortening of SnowObs' `long_name`s, so labels fit a 300px card. */
export function variableDisplayName(longName: string): string {
  return longName
    .replace('Precipitation', 'Precip')
    .replace('Equivalent', 'Equiv')
    .replace('diff', 'Diff')
}

/** Sixteen-point compass label for a wind direction in degrees, as the widget shows it. */
export function windDirectionLabel(degrees: number | null): string | null {
  if (degrees == null || !Number.isFinite(degrees)) return null
  const points = [
    'N',
    'NNE',
    'NE',
    'ENE',
    'E',
    'ESE',
    'SE',
    'SSE',
    'S',
    'SSW',
    'SW',
    'WSW',
    'W',
    'WNW',
    'NW',
    'NNW',
  ]
  // 360 wraps to N; each point spans 22.5°, centred on its heading.
  const index = Math.round((((degrees % 360) + 360) % 360) / 22.5) % 16
  return points[index]
}

/**
 * The rotation of an up-pointing arrow so it shows where the wind is blowing *to*: a wind from
 * the north (0°) points the arrow south.
 */
export function windArrowRotation(degrees: number): number {
  return (((degrees + 180) % 360) + 360) % 360
}

/** Minutes between a reading and `now`; `Infinity` for a station that has never reported. */
export function minutesSince(observedAt: string | null, now: number): number {
  if (!observedAt) return Infinity
  const at = Date.parse(observedAt)
  return Number.isFinite(at) ? Math.max(0, Math.floor((now - at) / 60_000)) : Infinity
}

/**
 * A reading's time as the widget shows it (`MMM D HH:mm`), but in the center's timezone rather
 * than the browser's (inventory row X2).
 */
export function formatObservedAt(observedAt: string | null, timeZone: string): string {
  if (!observedAt) return '—'
  const at = new Date(observedAt)
  if (!Number.isFinite(at.getTime())) return '—'
  const parts = observedAtFormatter(timeZone).formatToParts(at)
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? ''
  return `${get('month')} ${get('day')} ${get('hour')}:${get('minute')}`
}

/** A formatter for the center's zone, or UTC if the center's metadata carries a zone Intl rejects. */
function observedAtFormatter(timeZone: string): Intl.DateTimeFormat {
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }
  try {
    return new Intl.DateTimeFormat('en-US', { timeZone, ...options })
  } catch {
    // RangeError for an unknown zone: a wrong-but-labelled time beats no card at all.
    return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', ...options })
  }
}

// --- Data sources ----------------------------------------------------------------------------

/**
 * Synoptic Data is what MesoWest became; the widget renames the source on the way in so the legend
 * and the source filter show the current name.
 */
export function normalizeSource(source: string): string {
  return source === 'mesowest' ? 'synoptic-data' : source
}

/** Marker and legend colors per source — the widget's `$synoptic-data`, `$snotel` and `$nwac`. */
export const SOURCE_COLORS: Record<string, string> = {
  'synoptic-data': '#2980b9',
  snotel: '#27ae60',
  nwac: '#d35400',
}

/** A source the widget has no color for; dashboard-v2's neutral for the same case. */
export const DEFAULT_SOURCE_COLOR = '#576574'

export function sourceColor(source: string, colorBySource: boolean): string {
  if (!colorBySource) return SOURCE_COLORS['synoptic-data']
  return SOURCE_COLORS[source] ?? DEFAULT_SOURCE_COLOR
}

/** `synoptic-data` → `SYNOPTIC DATA`, `nwac` → `NWAC`, as the legend and card show it. */
export function sourceLabel(source: string): string {
  return source.replace(/-/g, ' ').toUpperCase()
}
