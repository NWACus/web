import type { WeatherStationGroup } from '@/constants/weatherStations'

// Fixed public presets for the station Graphs tab (grill-me 2026-07-20): each
// chart names the variables it wants; a station only gets the charts (and
// variables) its registry columns actually configure.

export type GraphPreset = {
  key: string
  title: string
  variables: string[]
  /** Dots instead of a connected line (wind direction wraps at 360°). */
  symbolsOnly?: boolean
}

const PRESETS: GraphPreset[] = [
  { key: 'temp', title: 'Temperature', variables: ['air_temp'] },
  { key: 'rh', title: 'Relative Humidity', variables: ['relative_humidity'] },
  {
    key: 'wind',
    title: 'Wind Speed',
    variables: ['wind_speed_min', 'wind_speed', 'wind_gust'],
  },
  { key: 'winddir', title: 'Wind Direction', variables: ['wind_direction'], symbolsOnly: true },
  { key: 'snowdepth', title: 'Total Snow Depth', variables: ['snow_depth'] },
  // Both 24h-snow sensor spellings exist across the registry.
  { key: 'snow24', title: '24 Hour Snow Total', variables: ['snow_depth_24h', 'snow_depth_24hr'] },
  { key: 'intersnow', title: 'Intermittent Snow', variables: ['intermittent_snow'] },
  { key: 'precip', title: 'Precipitation', variables: ['precip_accum_one_hour'] },
  { key: 'solar', title: 'Solar Radiation', variables: ['solar_radiation'] },
  { key: 'pressure', title: 'Barometric Pressure', variables: ['pressure'] },
  { key: 'equiptemp', title: 'Equipment Temperature', variables: ['equip_temperature'] },
]

export type GraphWindow = { key: string; label: string; hours: number }

export const GRAPH_WINDOWS: GraphWindow[] = [
  { key: '24h', label: '24 hours', hours: 24 },
  { key: '7d', label: '7 days', hours: 7 * 24 },
  { key: '30d', label: '30 days', hours: 30 * 24 },
  { key: '3m', label: '3 months', hours: 91 * 24 },
  { key: '6m', label: '6 months', hours: 182 * 24 },
  // "Season" = back to Oct 1; approximated as a trailing window server-side.
  { key: 'season', label: 'Season', hours: 0 },
]

// Hours back to the most recent Oct 1 (the season anchor).
export function seasonHours(now: Date): number {
  const year = now.getMonth() >= 9 ? now.getFullYear() : now.getFullYear() - 1
  const seasonStart = new Date(Date.UTC(year, 9, 1))
  return Math.max(24, Math.ceil((now.getTime() - seasonStart.getTime()) / (60 * 60 * 1000)))
}

// All presets are offered to every station: the registry's columns only cover
// the NOW-table subset, while loggers report more sensors (pressure, equip
// temp, ...). Charts whose fetch returns no series hide themselves instead.
export function presetsForGroup(_group: WeatherStationGroup): GraphPreset[] {
  return PRESETS
}
