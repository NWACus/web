import type { GraphData, GraphSeries } from '@/services/snowobs/graph'
import type { EChartOption } from './EChart'

// Builds the ECharts option for one preset chart from the graph-data response.
// Raw series render as lines; daily-aggregated series render as a mean line
// plus a shaded min→max band (two stacked helper series).

// Fixed palette so a series' min-max band always shades in ITS line's color
// (auto-assignment gave the invisible band helpers their own colors).
const SERIES_COLORS = ['#2563eb', '#dc2626', '#059669', '#d97706', '#7c3aed', '#0891b2']

// Series grouped onto up to two y-axes by unit (°F and % on one chart, etc.).
function unitAxes(series: GraphSeries[]): string[] {
  const units: string[] = []
  for (const s of series) {
    if (!units.includes(s.unit)) units.push(s.unit)
  }
  return units.slice(0, 2)
}

function axisIndexFor(unit: string, axes: string[]): number {
  const index = axes.indexOf(unit)
  return index === -1 ? 0 : index
}

function rawSeries(s: GraphSeries & { kind: 'raw' }, yAxisIndex: number, color: string): object[] {
  return [
    {
      name: s.label,
      type: 'line',
      color,
      yAxisIndex,
      showSymbol: false,
      connectNulls: false,
      data: s.points,
    },
  ]
}

// Mean line + min→max band: a transparent "floor" line at min, stacked with
// (max − min) area on top.
function dailySeries(
  s: GraphSeries & { kind: 'daily' },
  yAxisIndex: number,
  color: string,
): object[] {
  const stack = `band-${s.label}`
  return [
    {
      name: s.label,
      type: 'line',
      color,
      yAxisIndex,
      showSymbol: false,
      data: s.days.map(([t, , mean]) => [t, mean]),
    },
    {
      name: `${s.label} range`,
      type: 'line',
      color,
      yAxisIndex,
      stack,
      showSymbol: false,
      lineStyle: { opacity: 0 },
      tooltip: { show: false },
      legendHoverLink: false,
      silent: true,
      data: s.days.map(([t, min]) => [t, min]),
    },
    {
      name: `${s.label} range`,
      type: 'line',
      color,
      yAxisIndex,
      stack,
      showSymbol: false,
      lineStyle: { opacity: 0 },
      areaStyle: { color, opacity: 0.14 },
      tooltip: { show: false },
      legendHoverLink: false,
      silent: true,
      data: s.days.map(([t, min, , max]) => [t, max - min]),
    },
  ]
}

export function buildChartOption(data: GraphData, title: string): EChartOption {
  const axes = unitAxes(data.series)
  const series = data.series.flatMap((s, i) => {
    const yAxisIndex = axisIndexFor(s.unit, axes)
    const color = SERIES_COLORS[i % SERIES_COLORS.length]
    return s.kind === 'raw' ? rawSeries(s, yAxisIndex, color) : dailySeries(s, yAxisIndex, color)
  })
  return {
    // Title top-left, legend on its own row below — they no longer collide.
    title: { text: title, left: 0, top: 0, textStyle: { fontSize: 15, fontWeight: 600 } },
    tooltip: { trigger: 'axis' },
    legend: { top: 26, left: 0, type: 'scroll', data: data.series.map((s) => s.label) },
    grid: { left: 64, right: 64, top: 64, bottom: 64 },
    xAxis: {
      type: 'time',
      axisLabel: {
        hideOverlap: true,
        // Lead date-level ticks with the day of week ("Mon Jul 20"; hourly
        // ticks "Mon 14:00") — forecasters think in storm days.
        formatter: {
          year: '{yyyy}',
          month: '{MMM} {yyyy}',
          day: '{ee} {MMM} {d}',
          hour: '{ee} {HH}:{mm}',
          minute: '{HH}:{mm}',
        },
      },
    },
    // Unit reads along the axis (rotated, centered) instead of a clipped label
    // floating above the axis top.
    yAxis: axes.map((unit, i) => ({
      type: 'value',
      name: unit,
      nameLocation: 'middle',
      nameGap: 44,
      nameRotate: i === 0 ? 90 : -90,
      nameTextStyle: { fontSize: 12 },
      position: i === 0 ? 'left' : 'right',
      scale: true,
      splitLine: { show: i === 0 },
    })),
    dataZoom: [
      { type: 'inside', xAxisIndex: 0 },
      { type: 'slider', xAxisIndex: 0, height: 18, bottom: 8 },
    ],
    series,
  }
}
