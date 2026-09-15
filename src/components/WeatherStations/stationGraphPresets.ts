export type GraphPreset = {
  key: string
  title: string
  variables: string[]
  /** Dots instead of a connected line (wind direction wraps at 360°). */
  symbolsOnly?: boolean
  /** Bounds the axis always covers, from the legacy plotter's
   * `getVariableBounds`. A floor, not a ceiling: real data widens the axis. */
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
  defaultHidden?: boolean
}

// Graphs-tab comparison cap; the graph-data route derives its station cap from this.
export const MAX_COMPARE_STATIONS = 3

// Optional per-page floors, set on the station page in the admin. Each one
// replaces the matching preset's default `axis.max`; still a floor, not a
// ceiling, so a bigger reading widens the axis just as it does by default.
export type GraphAxisOverrides = {
  snowDepthMax?: number | null
  snowfall24Max?: number | null
  precipMax?: number | null
}

const AXIS_OVERRIDE_BY_PRESET: Record<string, keyof GraphAxisOverrides> = {
  snowdepth: 'snowDepthMax',
  snow24: 'snowfall24Max',
  precip: 'precipMax',
}

export function applyGraphAxes(presets: GraphPreset[], overrides: GraphAxisOverrides): GraphPreset[] {
  return presets.map((preset) => {
    const key = AXIS_OVERRIDE_BY_PRESET[preset.key]
    const max = key ? overrides[key] : null
    if (max == null) return preset
    return { ...preset, axis: { ...preset.axis, max } }
  })
}

// Every station gets the full preset list — loggers report more sensors than
// the registry's NOW-table columns. Charts with no data hide themselves, and
// the default-hidden ones sort last to keep the Edit graphs list tidy.
export const STATION_GRAPH_PRESETS: GraphPreset[] = [
  { key: 'temp', title: 'Temperature', variables: ['air_temp'], refLine: 32, allowNegative: true },
  {
    key: 'wind',
    title: 'Wind Speed',
    variables: ['wind_speed_min', 'wind_speed', 'wind_gust'],
    band: { lower: 'wind_speed_min', upper: 'wind_gust' },
    axis: { min: 0 },
  },
  { key: 'winddir', title: 'Wind Direction', variables: ['wind_direction'], symbolsOnly: true },
  {
    key: 'precip',
    title: 'Precipitation',
    variables: ['precip_accum_one_hour'],
    bar: true,
    axis: { min: 0, max: 0.35 },
  },
  {
    key: 'snow24',
    title: '24 Hour Snow Total',
    variables: ['snow_depth_24h'],
    axis: { min: 0, max: 24 },
  },
  {
    key: 'intersnow',
    title: 'Intermittent Snow',
    variables: ['intermittent_snow'],
    axis: { min: 0 },
  },
  {
    key: 'snowdepth',
    title: 'Total Snow Depth',
    variables: ['snow_depth'],
    axis: { min: 0, max: 150 },
  },
  // Legacy also plotted a `net_solar` "Solar Radiation" chart. SnowObs doesn't
  // serve that variable for the NWAC source, so only the pyranometer remains —
  // the two measure different things, so this one keeps its own name.
  {
    key: 'pyranometer',
    title: 'Solar Pyranometer',
    variables: ['solar_radiation'],
    axis: { min: 0 },
  },
  {
    key: 'pressure',
    title: 'Barometric Pressure',
    variables: ['pressure'],
    axis: { min: 950, max: 1050 },
  },
  {
    key: 'equiptemp',
    title: 'Equipment Temperature',
    variables: ['equip_temperature'],
    refLine: 32,
    allowNegative: true,
  },
  {
    key: 'rh',
    title: 'Relative Humidity',
    variables: ['relative_humidity'],
    axis: { min: 0, max: 100 },
    defaultHidden: true,
  },
  {
    key: 'battery',
    title: 'Battery Voltage',
    variables: ['battery_voltage'],
    axis: { min: 8, max: 16 },
    defaultHidden: true,
  },
]
