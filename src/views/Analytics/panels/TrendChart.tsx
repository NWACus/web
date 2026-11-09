'use client'

import { EChart, type EChartOption } from '@/components/charts/EChart'
import type { PanelData, TimeseriesData } from '@/services/posthog/panelTypes'
import { cn } from '@/utilities/ui'
import { useEffect, useMemo, useState } from 'react'
import { formatInteger } from '../format'
import { TabPills } from '../TabPills'
import { usePanel, type PanelRequest } from '../usePanel'
import { MUTED, PanelBody } from './Panel'

const pickTimeseries = (data: PanelData): TimeseriesData | null =>
  data.kind === 'timeseries' ? data : null

const SERIES = [
  { key: 'visitors', label: 'Visitors' },
  { key: 'visits', label: 'Visits' },
  { key: 'pageviews', label: 'Pageviews' },
] as const
type SeriesKey = (typeof SERIES)[number]['key']

/**
 * The admin theme and the brand palette live in CSS variables; ECharts needs resolved colors.
 * Resolving through an element's computed `color` yields `rgb(...)`, which ECharts can re-derive
 * for hover states; the raw `hsl(215 25% 47%)` form in colors.css draws once but turns
 * transparent on emphasis. The line uses the site's brand blue, not Payload's status colors.
 */
function useThemeColors() {
  const [colors, setColors] = useState({ text: '#777', grid: '#ddd', line: '#5b7a9d' })
  useEffect(() => {
    const probe = document.createElement('span')
    document.body.appendChild(probe)
    const resolve = (name: string, fallback: string) => {
      probe.style.color = `var(${name})`
      const color = getComputedStyle(probe).color
      return color && color !== 'rgba(0, 0, 0, 0)' ? color : fallback
    }
    setColors({
      text: resolve('--theme-elevation-600', '#777'),
      grid: resolve('--theme-elevation-150', '#ddd'),
      line: resolve('--brand-500', '#5b7a9d'),
    })
    probe.remove()
  }, [])
  return colors
}

const dayLabel = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })

function Chart({ data, series }: { data: TimeseriesData; series: SeriesKey }) {
  const colors = useThemeColors()
  const option = useMemo<EChartOption>(
    () => ({
      animation: false,
      grid: { left: 8, right: 8, top: 16, bottom: 8, containLabel: true },
      tooltip: {
        trigger: 'axis',
        valueFormatter: (value: unknown) => (typeof value === 'number' ? formatInteger(value) : ''),
      },
      xAxis: {
        type: 'category',
        data: data.points.map((point) => dayLabel(point.date)),
        boundaryGap: false,
        axisLine: { lineStyle: { color: colors.grid } },
        axisLabel: { color: colors.text },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        splitLine: { lineStyle: { color: colors.grid } },
        axisLabel: { color: colors.text, formatter: (value: number) => formatInteger(value) },
      },
      series: [
        {
          type: 'line',
          name: SERIES.find((s) => s.key === series)?.label,
          data: data.points.map((point) => point[series]),
          smooth: 0.2,
          showSymbol: data.points.length <= 31,
          lineStyle: { color: colors.line, width: 2 },
          itemStyle: { color: colors.line },
          areaStyle: { color: colors.line, opacity: 0.12 },
          // Hover should only show the tooltip, never restyle the line
          emphasis: { disabled: true },
        },
      ],
    }),
    [data, series, colors],
  )
  return <EChart option={option} height={280} />
}

export function TrendChart({ request }: { request: PanelRequest }) {
  const [series, setSeries] = useState<SeriesKey>('visitors')
  const state = usePanel('timeseries', request, pickTimeseries)
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <TabPills options={SERIES} active={series} onChange={setSeries} />
        {state.status === 'ready' && (
          <span className={cn('text-xs', MUTED)}>
            {state.data.bucket === 'week' ? 'By week' : 'By day'}
          </span>
        )}
      </div>
      <PanelBody state={state} empty="No pageviews in this period.">
        {(data) => (data.points.length === 0 ? null : <Chart data={data} series={series} />)}
      </PanelBody>
    </div>
  )
}
