import { NWAC_DISPLAY_TIMEZONE } from '@/services/snowobs/constants'
import { TZDate } from '@date-fns/tz'
import { differenceInHours } from 'date-fns'

export type GraphPreset = {
  key: string
  title: string
  variables: string[]
  /** Dots instead of a connected line (wind direction wraps at 360°). */
  symbolsOnly?: boolean
  /** Fixed y-axis bounds (legacy pins some, e.g. RH 0-100). */
  axis?: { min?: number; max?: number }
  /** Horizontal reference line (legacy: 32°F freezing line on temperature). */
  refLine?: number
  /** Render these two variables as a shaded band instead of their own lines
   * (wind: min→gust around the speed line). */
  band?: { lower: string; upper: string }
  /** Bars instead of a line (legacy renders precipitation as a bar plot). */
  bar?: boolean
  /** Sub-zero readings are real (temperature); everywhere else they're sensor
   * noise and clamp to zero. */
  allowNegative?: boolean
}

// Every station gets the full preset list — loggers report more sensors than
// the registry's NOW-table columns. Charts with no data hide themselves.
export const STATION_GRAPH_PRESETS: GraphPreset[] = [
  { key: 'temp', title: 'Temperature', variables: ['air_temp'], refLine: 32, allowNegative: true },
  {
    key: 'rh',
    title: 'Relative Humidity',
    variables: ['relative_humidity'],
    axis: { min: 0, max: 100 },
  },
  {
    key: 'wind',
    title: 'Wind Speed',
    variables: ['wind_speed_min', 'wind_speed', 'wind_gust'],
    band: { lower: 'wind_speed_min', upper: 'wind_gust' },
  },
  { key: 'winddir', title: 'Wind Direction', variables: ['wind_direction'], symbolsOnly: true },
  { key: 'snowdepth', title: 'Total Snow Depth', variables: ['snow_depth'] },
  // Both 24h-snow sensor spellings exist across the registry.
  { key: 'snow24', title: '24 Hour Snow Total', variables: ['snow_depth_24h', 'snow_depth_24hr'] },
  { key: 'intersnow', title: 'Intermittent Snow', variables: ['intermittent_snow'] },
  { key: 'precip', title: 'Precipitation', variables: ['precip_accum_one_hour'], bar: true },
  // Legacy naming per the WP plugin's snowobs mapping: "Solar Radiation" is the
  // net_solar sensor; "Solar Pyranometer" is snowobs solar_radiation.
  { key: 'solar', title: 'Solar Radiation', variables: ['net_solar'] },
  { key: 'pyranometer', title: 'Solar Pyranometer', variables: ['solar_radiation'] },
  { key: 'pressure', title: 'Barometric Pressure', variables: ['pressure'] },
  { key: 'equiptemp', title: 'Equipment Temperature', variables: ['equip_temperature'] },
]

// Hours back to the most recent Oct 1 (the season anchor, display timezone).
export function seasonHours(now: Date): number {
  const local = new TZDate(now.getTime(), NWAC_DISPLAY_TIMEZONE)
  const year = local.getMonth() >= 9 ? local.getFullYear() : local.getFullYear() - 1
  const seasonStart = new TZDate(year, 9, 1, NWAC_DISPLAY_TIMEZONE)
  return Math.max(24, differenceInHours(now, seasonStart, { roundingMethod: 'ceil' }))
}

export type GraphWindow = { key: string; label: string; hoursBack: (now: Date) => number }

const WEEK_WINDOW: GraphWindow = { key: '7d', label: '7 days', hoursBack: () => 7 * 24 }

export const GRAPH_WINDOWS: GraphWindow[] = [
  { key: '24h', label: '24 hours', hoursBack: () => 24 },
  WEEK_WINDOW,
  { key: '30d', label: '30 days', hoursBack: () => 30 * 24 },
  { key: '3m', label: '3 months', hoursBack: () => 91 * 24 },
  { key: '6m', label: '6 months', hoursBack: () => 182 * 24 },
  { key: 'season', label: 'Season', hoursBack: seasonHours },
]

export const DEFAULT_GRAPH_WINDOW = WEEK_WINDOW
