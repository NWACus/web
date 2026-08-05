// Metric display conversions per SnowObs variable. SnowObs serves imperial
// everywhere; display layers (graphs, tables, CSV) convert on demand. Keyed by
// variable rather than unit so inches can become cm (snow) or mm (precip).

export type MetricConversion = { unit: string; convert: (v: number) => number }

const toCelsius: MetricConversion = { unit: '°C', convert: (v) => ((v - 32) * 5) / 9 }
const toKmh: MetricConversion = { unit: 'km/h', convert: (v) => v * 1.609344 }
const toCm: MetricConversion = { unit: 'cm', convert: (v) => v * 2.54 }
const toMm: MetricConversion = { unit: 'mm', convert: (v) => v * 25.4 }

const CONVERSIONS: Record<string, MetricConversion> = {
  air_temp: toCelsius,
  equip_temperature: toCelsius,
  dew_point_temperature: toCelsius,
  wind_speed: toKmh,
  wind_speed_min: toKmh,
  wind_gust: toKmh,
  snow_depth: toCm,
  snow_depth_24h: toCm,
  snow_depth_24hr: toCm,
  intermittent_snow: toCm,
  precip_accum_one_hour: toMm,
  precip_accum_24hr: toMm,
  precip_accum: toMm,
  precip_cumsum: toMm,
  snow_water_equiv: toMm,
  snow_water_equiv_24hr: toMm,
}

// Null for variables that render the same in both systems (%, degrees, W/m²).
export function metricConversionFor(variable: string): MetricConversion | null {
  return CONVERSIONS[variable] ?? null
}
