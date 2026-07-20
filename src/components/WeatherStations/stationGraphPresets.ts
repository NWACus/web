import type { WeatherStationGroup } from '@/constants/weatherStations'

// Fixed public presets for the station Graphs tab (grill-me 2026-07-20): each
// chart names the variables it wants; a station only gets the charts (and
// variables) its registry columns actually configure.

export type GraphPreset = {
  key: string
  title: string
  variables: string[]
}

const PRESETS: GraphPreset[] = [
  { key: 'temp', title: 'Temperature', variables: ['air_temp'] },
  { key: 'rh', title: 'Relative Humidity', variables: ['relative_humidity'] },
  { key: 'wind', title: 'Wind', variables: ['wind_speed', 'wind_gust'] },
  {
    key: 'snow',
    title: 'Snow Depth & Precipitation',
    variables: ['snow_depth', 'snow_depth_24h', 'precip_accum_one_hour'],
  },
  { key: 'solar', title: 'Solar Radiation', variables: ['solar_radiation'] },
]

export type GraphWindow = { key: string; label: string; hours: number }

export const GRAPH_WINDOWS: GraphWindow[] = [
  { key: '24h', label: '24 hours', hours: 24 },
  { key: '7d', label: '7 days', hours: 7 * 24 },
  { key: '30d', label: '30 days', hours: 30 * 24 },
  // "Season" = back to Oct 1; approximated as a trailing window server-side.
  { key: 'season', label: 'Season', hours: 0 },
]

// Hours back to the most recent Oct 1 (the season anchor).
export function seasonHours(now: Date): number {
  const year = now.getMonth() >= 9 ? now.getFullYear() : now.getFullYear() - 1
  const seasonStart = new Date(Date.UTC(year, 9, 1))
  return Math.max(24, Math.ceil((now.getTime() - seasonStart.getTime()) / (60 * 60 * 1000)))
}

// The presets a station group supports, with variables trimmed to what its
// registry columns configure.
export function presetsForGroup(group: WeatherStationGroup): GraphPreset[] {
  const configured = new Set(group.columns.map(([, variable]) => variable))
  return PRESETS.flatMap((preset) => {
    const variables = preset.variables.filter((v) => configured.has(v))
    return variables.length > 0 ? [{ ...preset, variables }] : []
  })
}
