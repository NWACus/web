'use client'

import { EChart, type EChartOption } from '@/components/charts/EChart'
import type { PanelData, TimeseriesData } from '@/services/posthog/panelTypes'
import { cn } from '@/utilities/ui'
import { useEffect, useMemo, useState } from 'react'
import { formatInteger } from '../format'
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

/** Payload's theme lives in CSS variables; ECharts needs resolved colors. */
function useThemeColors() {
  const [colors, setColors] = useState({ text: '#777', grid: '#ddd', line: '#2563eb' })
  useEffect(() => {
    const style = getComputedStyle(document.documentElement)
    const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback
    setColors({
      text: read('--theme-elevation-600', '#777'),
      grid: read('--theme-elevation-150', '#ddd'),
      line: read('--theme-success-500', '#2563eb'),
    })
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
    <section className="flex flex-col gap-3 rounded border border-[var(--theme-elevation-150)] bg-[var(--theme-elevation-0)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-3">
          {SERIES.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setSeries(option.key)}
              className={cn(
                'text-xs font-semibold uppercase tracking-wide',
                option.key === series
                  ? 'text-[var(--theme-text)] underline underline-offset-4'
                  : MUTED,
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        {state.status === 'ready' && (
          <span className={cn('text-xs', MUTED)}>
            {state.data.bucket === 'week' ? 'By week' : 'By day'}
          </span>
        )}
      </div>
      <PanelBody state={state} empty="No pageviews in this period.">
        {(data) => (data.points.length === 0 ? null : <Chart data={data} series={series} />)}
      </PanelBody>
    </section>
  )
}
