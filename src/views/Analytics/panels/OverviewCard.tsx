'use client'

import type { DateRange } from '@/services/posthog/analyticsRange'
import type { ECharts } from 'echarts/core'
import { useEffect, useRef, useState } from 'react'
import { useReport, type ReportRequest, type ReportState } from '../useReport'
import { ExportMenu } from './ExportMenu'
import { PanelHeader } from './Panel'
import { parseOverview, StatsRow } from './StatsRow'
import {
  parseTimeseries,
  TrendChart,
  trendExportItems,
  useThemeColors,
  type SeriesKey,
  type TrendGrouping,
} from './TrendChart'

const LOADING: ReportState<never> = { status: 'loading' }

/**
 * Holds the stats back until the trend has loaded too, the first time for a request. Regrouping the
 * trend afterwards reloads only the chart, so the stats stay up.
 */
function useRevealTogether(
  request: ReportRequest,
  overview: ReportState<unknown>,
  trend: ReportState<unknown>,
) {
  const settled = overview.status !== 'loading' && trend.status !== 'loading'
  const key = `${request.center}|${request.from}|${request.to}|${request.generation}`
  const [revealed, setRevealed] = useState('')
  useEffect(() => {
    if (settled) setRevealed(key)
  }, [settled, key])
  return { settled, showStats: settled || (revealed === key && overview.status !== 'loading') }
}

/**
 * The stats row and trend chart in one card. It renders before the lists so its requests go out
 * first, and holds both back until both have loaded so the numbers and the chart appear together.
 */
export function OverviewCard({
  request,
  centerName,
  trend: grouping,
  onVisitors,
  onViewPeriod,
}: {
  request: ReportRequest
  centerName: string
  trend: TrendGrouping
  /** The period's unique visitors, which the lists' share column divides by. */
  onVisitors: (visitors: number | undefined) => void
  /** Switches the page to the comparison period. */
  onViewPeriod: (range: DateRange) => void
}) {
  const overview = useReport('overview', request, parseOverview)
  const trend = useReport(
    'timeseries',
    { ...request, interval: grouping.interval },
    parseTimeseries,
  )
  const [series, setSeries] = useState<SeriesKey>('visitors')
  const colors = useThemeColors()
  const chartRef = useRef<ECharts | null>(null)

  const visitors = overview.status === 'ready' ? overview.data.visitors.current : undefined
  useEffect(() => onVisitors(visitors), [visitors, onVisitors])

  const { settled, showStats } = useRevealTogether(request, overview, trend)
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
        <StatsRow state={showStats ? overview : LOADING} onViewPeriod={onViewPeriod} />
        <TrendChart
          state={settled ? trend : LOADING}
          series={series}
          onSeries={setSeries}
          grouping={grouping}
          colors={colors}
          chartRef={chartRef}
        />
      </div>
    </section>
  )
}
