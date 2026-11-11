'use client'

import { EChart, type EChartOption } from '@/components/charts/EChart'
import {
  timeseriesSchema,
  type OverviewData,
  type TimeseriesData,
} from '@/services/posthog/panelTypes'
import { saveCsv, saveUrl } from '@/utilities/export/saveFile'
import { cn } from '@/utilities/ui'
import type { ECharts } from 'echarts/core'
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { formatDateRange, formatInteger } from '../format'
import { analyticsExportFilename, overviewCsv, timeseriesCsv } from '../panelExport'
import { TabPills } from '../TabPills'
import { parseWith, usePanel, type PanelRequest, type PanelState } from '../usePanel'
import { ExportMenu, type ExportItem } from './ExportMenu'
import { MUTED, PanelBody } from './Panel'

const parseTimeseries = parseWith(timeseriesSchema)

const SERIES = [
  { key: 'visitors', label: 'Visitors' },
  { key: 'visits', label: 'Visits' },
  { key: 'pageviews', label: 'Pageviews' },
] as const
type SeriesKey = (typeof SERIES)[number]['key']
type ChartColors = { text: string; grid: string; line: string }

/**
 * The admin theme and the brand palette live in CSS variables; ECharts needs resolved colors.
 * Resolving through an element's computed `color` yields `rgb(...)`, which ECharts can re-derive
 * for hover states; the raw `hsl(215 25% 47%)` form in colors.css draws once but turns
 * transparent on emphasis. The line uses the site's brand blue, not Payload's status colors.
 */
function useThemeColors() {
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

const dayLabel = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })

function trendOption(
  data: TimeseriesData,
  series: SeriesKey,
  colors: ChartColors,
  title?: string,
): EChartOption {
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
        name: seriesLabel(series),
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

function trendExportItems({
  request,
  centerName,
  series,
  colors,
  chartRef,
  trend,
  overview,
}: {
  request: PanelRequest
  centerName: string
  series: SeriesKey
  colors: ChartColors
  chartRef: RefObject<ECharts | null>
  trend: PanelState<TimeseriesData>
  overview: PanelState<OverviewData>
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

/** The trend chart, whose export menu also carries the stats row above it. */
export function TrendChart({
  request,
  centerName,
  overview,
}: {
  request: PanelRequest
  centerName: string
  overview: PanelState<OverviewData>
}) {
  const [series, setSeries] = useState<SeriesKey>('visitors')
  const state = usePanel('timeseries', request, parseTimeseries)
  const colors = useThemeColors()
  const chartRef = useRef<ECharts | null>(null)
  const exportItems = trendExportItems({
    request,
    centerName,
    series,
    colors,
    chartRef,
    trend: state,
    overview,
  })
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <TabPills options={SERIES} active={series} onChange={setSeries} />
        <div className="flex items-center gap-3">
          {state.status === 'ready' && (
            <span className={cn('text-xs', MUTED)}>
              {state.data.bucket === 'week' ? 'By week' : 'By day'}
            </span>
          )}
          <ExportMenu name="trend and summary" items={exportItems} />
        </div>
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
