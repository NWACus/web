import type { GraphData, GraphSeries } from '@/services/snowobs/graph'
import type { EChartOption } from './EChart'

// Builds the ECharts option for one preset chart from the graph-data response.
// Raw series render as lines; daily-aggregated series render as a mean line
// plus a shaded min→max band (two stacked helper series).

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

function rawSeries(s: GraphSeries & { kind: 'raw' }, yAxisIndex: number): object[] {
  return [
    {
      name: s.label,
      type: 'line',
      yAxisIndex,
      showSymbol: false,
      connectNulls: false,
      data: s.points,
    },
  ]
}

// Mean line + min→max band: a transparent "floor" line at min, stacked with
// (max − min) area on top.
function dailySeries(s: GraphSeries & { kind: 'daily' }, yAxisIndex: number): object[] {
  const stack = `band-${s.label}`
  return [
    {
      name: s.label,
      type: 'line',
      yAxisIndex,
      showSymbol: false,
      data: s.days.map(([t, , mean]) => [t, mean]),
    },
    {
      name: `${s.label} range`,
      type: 'line',
      yAxisIndex,
      stack,
      showSymbol: false,
      lineStyle: { opacity: 0 },
      tooltip: { show: false },
      legendHoverLink: false,
      data: s.days.map(([t, min]) => [t, min]),
    },
    {
      name: `${s.label} range`,
      type: 'line',
      yAxisIndex,
      stack,
      showSymbol: false,
      lineStyle: { opacity: 0 },
      areaStyle: { opacity: 0.15 },
      tooltip: { show: false },
      legendHoverLink: false,
      data: s.days.map(([t, min, , max]) => [t, max - min]),
    },
  ]
}

export function buildChartOption(data: GraphData, title: string): EChartOption {
  const axes = unitAxes(data.series)
  const series = data.series.flatMap((s) => {
    const yAxisIndex = axisIndexFor(s.unit, axes)
    return s.kind === 'raw' ? rawSeries(s, yAxisIndex) : dailySeries(s, yAxisIndex)
  })
  return {
    title: { text: title, left: 0, textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    legend: { top: 0, right: 0, data: data.series.map((s) => s.label) },
    grid: { left: 48, right: 48, top: 40, bottom: 56 },
    xAxis: { type: 'time' },
    yAxis: axes.map((unit, i) => ({
      type: 'value',
      name: unit,
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
