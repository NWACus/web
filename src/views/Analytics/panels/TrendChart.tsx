'use client'

import { EChart, type EChartOption } from '@/components/charts/EChart'
import type { TrendInterval } from '@/services/posthog/analyticsRange'
import {
  timeseriesSchema,
  type OverviewData,
  type TimeseriesData,
  type TimeseriesPoint,
} from '@/services/posthog/reportTypes'
import { saveCsv, saveUrl } from '@/utilities/export/saveFile'
import { cn } from '@/utilities/ui'
import type { ECharts } from 'echarts/core'
import { useEffect, useMemo, useState, type RefObject } from 'react'
import { formatDateRange, formatInteger } from '../format'
import { analyticsExportFilename, overviewCsv, timeseriesCsv } from '../panelExport'
import { TabPills } from '../TabPills'
import { parseWith, type ReportRequest, type ReportState } from '../useReport'
import type { ExportItem } from './ExportMenu'
import { MUTED, PanelBody } from './Panel'

export const parseTimeseries = parseWith(timeseriesSchema)

const SERIES = [
  { key: 'visitors', label: 'Visitors' },
  { key: 'visits', label: 'Visits' },
  { key: 'pageviews', label: 'Pageviews' },
] as const
export type SeriesKey = (typeof SERIES)[number]['key']
export type ChartColors = { text: string; grid: string; line: string }

/**
 * The admin theme and the brand palette live in CSS variables; ECharts needs resolved colors.
 * Resolving through an element's computed `color` yields `rgb(...)`, which ECharts can re-derive
 * for hover states; the raw `hsl(215 25% 47%)` form in colors.css draws once but turns
 * transparent on emphasis. The line uses the site's brand blue, not Payload's status colors.
 */
export function useThemeColors() {
  const [colors, setColors] = useState<ChartColors>({ text: '#777', grid: '#ddd', line: '#5b7a9d' })
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

export const INTERVAL_OPTIONS = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
] as const

/** The trend's current grouping, the ones this range allows, and how to change it. */
export type TrendGrouping = {
  interval: TrendInterval
  intervals: TrendInterval[]
  onInterval: (interval: TrendInterval) => void
}

const axisLabel = (iso: string, bucket: TrendInterval) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString(
    'en-US',
    bucket === 'month'
      ? { month: 'short', year: 'numeric', timeZone: 'UTC' }
      : { month: 'short', day: 'numeric', timeZone: 'UTC' },
  )

/** "Oct 26 – Nov 1, 2026", or one day, flagged when the range or today cuts the bucket short. */
export function bucketTitle(point: TimeseriesPoint): string {
  const dates = formatDateRange(point.from, point.to)
  return point.partial ? `${dates} (partial)` : dates
}

/**
 * Partial buckets sit at the ends, so the line is split in two: solid through complete buckets and
 * dashed into each partial one. A complete bucket beside a partial one is in both so they join.
 */
export function splitPartial(points: TimeseriesPoint[], series: SeriesKey) {
  const isPartial = (index: number) => points[index]?.partial ?? false
  return {
    solid: points.map((point) => (point.partial ? null : point[series])),
    dashed: points.map((point, index) =>
      isPartial(index) || isPartial(index - 1) || isPartial(index + 1) ? point[series] : null,
    ),
  }
}

function tooltipHtml(params: unknown, data: TimeseriesData, series: SeriesKey): string {
  const first: unknown = Array.isArray(params) ? params[0] : params
  if (typeof first !== 'object' || first === null || !('dataIndex' in first)) return ''
  const point = typeof first.dataIndex === 'number' ? data.points[first.dataIndex] : undefined
  if (!point) return ''
  const marker = 'marker' in first && typeof first.marker === 'string' ? first.marker : ''
  return `${bucketTitle(point)}<br/>${marker}${seriesLabel(series)}: <b>${formatInteger(point[series])}</b>`
}

function trendOption(
  data: TimeseriesData,
  series: SeriesKey,
  colors: ChartColors,
  title?: string,
): EChartOption {
  const { solid, dashed } = splitPartial(data.points, series)
  const line = (values: (number | null)[], type: 'solid' | 'dashed') => ({
    type: 'line',
    name: seriesLabel(series),
    data: values,
    smooth: 0.2,
    showSymbol: data.points.length <= 31,
    lineStyle: { color: colors.line, width: 2, type },
    itemStyle: { color: colors.line },
    areaStyle: { color: colors.line, opacity: type === 'solid' ? 0.12 : 0.06 },
    // Hover should only show the tooltip, never restyle the line
    emphasis: { disabled: true },
  })
  return {
    animation: false,
    ...(title && {
      title: {
        text: title,
        left: 'center',
        top: 8,
        textStyle: { fontSize: 14, color: colors.text },
      },
    }),
    grid: { left: 8, right: 8, top: title ? 48 : 16, bottom: 8, containLabel: true },
    tooltip: {
      trigger: 'axis',
      formatter: (params: unknown) => tooltipHtml(params, data, series),
    },
    xAxis: {
      type: 'category',
      data: data.points.map((point) => axisLabel(point.date, data.bucket)),
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
    series: [line(solid, 'solid'), line(dashed, 'dashed')],
  }
}

const seriesLabel = (series: SeriesKey) => SERIES.find((s) => s.key === series)?.label ?? series

function Chart({
  data,
  series,
  colors,
  chartRef,
}: {
  data: TimeseriesData
  series: SeriesKey
  colors: ChartColors
  chartRef: RefObject<ECharts | null>
}) {
  const option = useMemo(() => trendOption(data, series, colors), [data, series, colors])
  return <EChart option={option} height={280} chartRef={chartRef} />
}

/**
 * Saves the chart as a PNG on white with a title naming the center, series and range, since a
 * saved image travels without the page around it. The admin may be in dark mode, so the export
 * swaps in light text and grid colors, then restores the on-screen option.
 */
function savePng(
  chart: ECharts,
  {
    data,
    series,
    colors,
    title,
    filename,
  }: {
    data: TimeseriesData
    series: SeriesKey
    colors: ChartColors
    title: string
    filename: string
  },
) {
  const light = { text: '#555555', grid: '#e2e2e2', line: colors.line }
  chart.setOption(trendOption(data, series, light, title), { notMerge: true })
  const dataUrl = chart.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#ffffff' })
  chart.setOption(trendOption(data, series, colors), { notMerge: true })
  saveUrl(dataUrl, filename)
}

/** The chart PNG and trend CSV, plus the stats row's CSV: the card's whole download menu. */
export function trendExportItems({
  request,
  centerName,
  series,
  colors,
  chartRef,
  trend,
  overview,
}: {
  request: ReportRequest
  centerName: string
  series: SeriesKey
  colors: ChartColors
  chartRef: RefObject<ECharts | null>
  trend: ReportState<TimeseriesData>
  overview: ReportState<OverviewData>
}): ExportItem[] {
  const filename = (label: string, extension: 'csv' | 'png') =>
    analyticsExportFilename(request.center, label, request, extension)
  const items: ExportItem[] = []
  if (trend.status === 'ready' && trend.data.points.length > 0) {
    const { data } = trend
    const title = `${centerName}: ${seriesLabel(series)}, ${formatDateRange(request.from, request.to)}`
    items.push(
      {
        label: 'Chart as PNG image',
        onSelect: () => {
          if (!chartRef.current) return
          savePng(chartRef.current, {
            data,
            series,
            colors,
            title,
            filename: filename(`${series} trend`, 'png'),
          })
        },
      },
      {
        label: 'Trend as CSV data',
        onSelect: () => saveCsv(timeseriesCsv(data), filename('trend', 'csv')),
      },
    )
  }
  if (overview.status === 'ready') {
    const { data, range } = overview
    items.push({
      label: 'Summary stats as CSV data',
      onSelect: () => saveCsv(overviewCsv(data, range), filename('summary', 'csv')),
    })
  }
  return items
}

/** The series tabs and the chart; the card around it owns the data and the download menu. */
export function TrendChart({
  state,
  series,
  onSeries,
  grouping,
  colors,
  chartRef,
}: {
  state: ReportState<TimeseriesData>
  series: SeriesKey
  onSeries: (series: SeriesKey) => void
  grouping: TrendGrouping
  colors: ChartColors
  chartRef: RefObject<ECharts | null>
}) {
  const intervalOptions = INTERVAL_OPTIONS.filter((option) =>
    grouping.intervals.includes(option.key),
  )
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <TabPills options={SERIES} active={series} onChange={onSeries} />
        {intervalOptions.length > 1 ? (
          <TabPills
            options={intervalOptions}
            active={grouping.interval}
            onChange={grouping.onInterval}
          />
        ) : (
          <span className={cn('text-xs', MUTED)}>By day</span>
        )}
      </div>
      <PanelBody state={state} empty="No pageviews in this period.">
        {(data) =>
          data.points.length === 0 ? null : (
            <Chart data={data} series={series} colors={colors} chartRef={chartRef} />
          )
        }
      </PanelBody>
    </div>
  )
}
