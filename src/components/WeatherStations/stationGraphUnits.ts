import type { GraphData, GraphSeries } from '@/services/snowobs/graph'
import type { MetricConversion, UnitSystem } from '@/services/snowobs/metricUnits'
import { metricConversionFor } from '@/services/snowobs/metricUnits'
import type { GraphPreset } from './stationGraphPresets'

// Metric display for the Graphs tab: charts convert client-side so toggling is
// instant and the graph-data CDN cache stays single-variant.

function convertSeries(s: GraphSeries, c: MetricConversion): GraphSeries {
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
      const conversion = metricConversionFor(s.variable)
      return conversion ? convertSeries(s, conversion) : s
    }),
  }
}

// The only unit-ful preset config is the reference line (32°F freezing);
// pinned axis bounds are all unitless (RH 0-100 %).
export function convertPreset(preset: GraphPreset, system: UnitSystem): GraphPreset {
  if (system === 'imperial' || preset.refLine === undefined) return preset
  const conversion = metricConversionFor(preset.variables[0])
  return conversion
    ? { ...preset, refLine: Math.round(conversion.convert(preset.refLine)) }
    : preset
}
