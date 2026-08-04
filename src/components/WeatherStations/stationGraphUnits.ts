import type { GraphData, GraphSeries } from '@/services/snowobs/graph'
import type { GraphPreset } from './stationGraphPresets'
import type { UnitSystem } from './UnitToggle'

// Metric display for the Graphs tab: SnowObs data stays imperial end-to-end
// (fetch, cache, CSV); charts convert client-side so toggling is instant and
// the graph-data CDN cache stays single-variant.

type Conversion = { unit: string; convert: (v: number) => number }

const toCelsius: Conversion = { unit: '°C', convert: (v) => ((v - 32) * 5) / 9 }
const toKmh: Conversion = { unit: 'km/h', convert: (v) => v * 1.609344 }
const toCm: Conversion = { unit: 'cm', convert: (v) => v * 2.54 }

// Keyed by variable rather than unit so inches can convert to cm (snow) or
// mm (precip). Variables without an entry (%, degrees, W/m², pressure) render
// as reported.
const METRIC_CONVERSIONS: Record<string, Conversion> = {
  air_temp: toCelsius,
  equip_temperature: toCelsius,
  wind_speed: toKmh,
  wind_speed_min: toKmh,
  wind_gust: toKmh,
  snow_depth: toCm,
  snow_depth_24h: toCm,
  snow_depth_24hr: toCm,
  intermittent_snow: toCm,
  precip_accum_one_hour: { unit: 'mm', convert: (v) => v * 25.4 },
}

function convertSeries(s: GraphSeries, c: Conversion): GraphSeries {
  if (s.kind === 'raw') {
    return {
      ...s,
      unit: c.unit,
      points: s.points.map(([t, v]) => [t, v === null ? null : c.convert(v)]),
    }
  }
  return {
    ...s,
    unit: c.unit,
    days: s.days.map(([t, min, mean, max]) => [t, c.convert(min), c.convert(mean), c.convert(max)]),
  }
}

// Sub-zero readings on non-temperature sensors are noise. Clamp in the
// sensor's native imperial units BEFORE metric conversion, so legitimately
// negative °C values survive (a 25°F equipment temp is -3.9°C, not 0).
export function clampNegativeValues(data: GraphData): GraphData {
  return {
    ...data,
    series: data.series.map((s) => {
      if (s.kind === 'raw') {
        return { ...s, points: s.points.map(([t, v]) => [t, v === null ? v : Math.max(0, v)]) }
      }
      return {
        ...s,
        days: s.days.map(([t, min, mean, max]) => [
          t,
          Math.max(0, min),
          Math.max(0, mean),
          Math.max(0, max),
        ]),
      }
    }),
  }
}

export function convertGraphData(data: GraphData, system: UnitSystem): GraphData {
  if (system === 'imperial') return data
  return {
    ...data,
    series: data.series.map((s) => {
      const conversion = METRIC_CONVERSIONS[s.variable]
      return conversion ? convertSeries(s, conversion) : s
    }),
  }
}

// The only unit-ful preset config is the reference line (32°F freezing);
// pinned axis bounds are all unitless (RH 0-100 %).
export function convertPreset(preset: GraphPreset, system: UnitSystem): GraphPreset {
  if (system === 'imperial' || preset.refLine === undefined) return preset
  const conversion = METRIC_CONVERSIONS[preset.variables[0]]
  return conversion
    ? { ...preset, refLine: Math.round(conversion.convert(preset.refLine)) }
    : preset
}
