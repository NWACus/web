import type { UnitSystem } from '@/services/snowobs/units'

/** `min` pins the bottom of the axis (0 for amounts). `minSpan` is the least
 * range the axis shows, so a quiet week doesn't stretch sensor noise to full
 * height; a pinned axis grows upward to reach it, an unpinned one centres the
 * data. Data past either widens the axis. */
export type GraphAxis = { min?: number; minSpan?: number }

export type GraphPreset = {
  key: string
  title: string
  variables: string[]
  /** Dots instead of a connected line (wind direction wraps at 360°). */
  symbolsOnly?: boolean
  axis?: GraphAxis
  /** Horizontal reference line (legacy: 32°F freezing line on temperature). */
  refLine?: number
  /** `refLine` and `axis` for metric readings, where a unit change moves them. */
  metric?: { refLine?: number; axis?: GraphAxis }
  /** Render these two variables as a shaded band instead of their own lines
   * (wind: min→gust around the speed line). */
  band?: { lower: string; upper: string }
  /** Bars instead of a line (legacy renders precipitation as a bar plot). */
  bar?: boolean
  /** Sub-zero readings are real (temperature); everywhere else they're sensor
   * noise and clamp to zero. */
  allowNegative?: boolean
  defaultHidden?: boolean
}

/** The preset as drawn in a unit system: metric swaps in its own reference line and axis. */
export function presetFor(preset: GraphPreset, system: UnitSystem): GraphPreset {
  return system === 'metric' && preset.metric ? { ...preset, ...preset.metric } : preset
}

// Graphs-tab comparison cap; the graph-data route derives its station cap from this.
export const MAX_COMPARE_STATIONS = 3
// Every station gets the full preset list — loggers report more sensors than
// the registry's NOW-table columns. Charts with no data hide themselves, and
// the default-hidden ones sort last to keep the Edit graphs list tidy.
export const STATION_GRAPH_PRESETS: GraphPreset[] = [
  {
    key: 'temp',
    title: 'Temperature',
    variables: ['air_temp'],
    refLine: 32,
    allowNegative: true,
    axis: { minSpan: 10 },
    metric: { refLine: 0, axis: { minSpan: 5 } },
  },
  {
    key: 'wind',
    title: 'Wind Speed',
    variables: ['wind_speed_min', 'wind_speed', 'wind_gust'],
    band: { lower: 'wind_speed_min', upper: 'wind_gust' },
    axis: { min: 0, minSpan: 10 },
    metric: { axis: { min: 0, minSpan: 16 } },
  },
  { key: 'winddir', title: 'Wind Direction', variables: ['wind_direction'], symbolsOnly: true },
  {
    key: 'precip',
    title: 'Precipitation',
    variables: ['precip_accum_one_hour'],
    bar: true,
    axis: { min: 0, minSpan: 0.1 },
    metric: { axis: { min: 0, minSpan: 2.5 } },
  },
  {
    key: 'snow24',
    title: '24 Hour Snow Total',
    variables: ['snow_depth_24h'],
    axis: { min: 0, minSpan: 6 },
    metric: { axis: { min: 0, minSpan: 15 } },
  },
  {
    key: 'intersnow',
    title: 'Intermittent Snow',
    variables: ['intermittent_snow'],
    axis: { min: 0, minSpan: 6 },
    metric: { axis: { min: 0, minSpan: 15 } },
  },
  {
    key: 'snowdepth',
    title: 'Total Snow Depth',
    variables: ['snow_depth'],
    axis: { min: 0, minSpan: 12 },
    metric: { axis: { min: 0, minSpan: 30 } },
  },
  // Legacy also plotted a `net_solar` "Solar Radiation" chart. SnowObs doesn't
  // serve that variable for the NWAC source, so only the pyranometer remains —
  // the two measure different things, so this one keeps its own name.
  {
    key: 'pyranometer',
    title: 'Solar Pyranometer',
    variables: ['solar_radiation'],
    axis: { min: 0, minSpan: 100 },
  },
  {
    key: 'pressure',
    title: 'Barometric Pressure',
    variables: ['pressure'],
    axis: { minSpan: 10 },
  },
  {
    key: 'equiptemp',
    title: 'Equipment Temperature',
    variables: ['equip_temperature'],
    refLine: 32,
    allowNegative: true,
    axis: { minSpan: 10 },
    metric: { refLine: 0, axis: { minSpan: 5 } },
  },
  {
    key: 'rh',
    title: 'Relative Humidity',
    variables: ['relative_humidity'],
    axis: { minSpan: 20 },
    defaultHidden: true,
  },
  {
    key: 'battery',
    title: 'Battery Voltage',
    variables: ['battery_voltage'],
    axis: { minSpan: 2 },
    defaultHidden: true,
  },
]
