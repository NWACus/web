'use client'

import type { ECharts } from 'echarts/core'
import { useEffect, useRef, useState } from 'react'
import { usePanel, type PanelRequest, type PanelState } from '../usePanel'
import { ExportMenu } from './ExportMenu'
import { PanelHeader } from './Panel'
import { parseOverview, StatsRow } from './StatsRow'
import {
  parseTimeseries,
  TrendChart,
  trendExportItems,
  useThemeColors,
  type SeriesKey,
} from './TrendChart'

const LOADING: PanelState<never> = { status: 'loading' }

/**
 * The stats row and trend chart in one card. It renders before the lists so its requests go out
 * first, and holds both back until both have loaded so the numbers and the chart appear together.
 */
export function OverviewCard({
  request,
  centerName,
  onVisitors,
}: {
  request: PanelRequest
  centerName: string
  /** The period's unique visitors, which the lists' share column divides by. */
  onVisitors: (visitors: number | undefined) => void
}) {
  const overview = usePanel('overview', request, parseOverview)
  const trend = usePanel('timeseries', request, parseTimeseries)
  const [series, setSeries] = useState<SeriesKey>('visitors')
  const colors = useThemeColors()
  const chartRef = useRef<ECharts | null>(null)

  const visitors = overview.status === 'ready' ? overview.data.visitors.current : undefined
  useEffect(() => onVisitors(visitors), [visitors, onVisitors])

  const settled = overview.status !== 'loading' && trend.status !== 'loading'
  const exportItems = trendExportItems({
    request,
    centerName,
    series,
    colors,
    chartRef,
    trend,
    overview,
  })
  return (
    <section className="card flex-col gap-0">
      <PanelHeader
        title="Traffic overview"
        actions={<ExportMenu name="trend and summary" items={exportItems} />}
      />
      <div className="flex flex-col gap-8">
        <StatsRow state={settled ? overview : LOADING} />
        <TrendChart
          state={settled ? trend : LOADING}
          series={series}
          onSeries={setSeries}
          colors={colors}
          chartRef={chartRef}
        />
      </div>
    </section>
  )
}
