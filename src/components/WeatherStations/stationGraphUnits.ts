import type { GraphData } from '@/services/snowobs/graph'

// Sub-zero readings on non-temperature sensors are noise.
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
