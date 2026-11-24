'use client'

import type { DateRange } from '@/services/posthog/analyticsRange'
import type { ECharts } from 'echarts/core'
import { useEffect, useRef, useState } from 'react'
import { useReport, type ReportRequest, type ReportState } from '../useReport'
import { ExportMenu } from './ExportMenu'
import { DocAnchor, InfoPopup } from './InfoPopup'
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

const STAT_DEFINITIONS: { term: string; text: string }[] = [
  {
    term: 'Unique visitors',
    text: 'People, each counted once. A person is recognized by their browser, so someone on both a phone and a laptop counts twice.',
  },
  {
    term: 'Total visits',
    text: 'Sessions. A visit ends after 30 minutes without activity, or at 24 hours.',
  },
  { term: 'Total pageviews', text: 'Every page load, including repeat views of a page.' },
  { term: 'Views per visit', text: 'Pageviews divided by visits.' },
  {
    term: 'Bounce rate',
    text: 'The share of visits that saw one page, clicked nothing and left within 10 seconds.',
  },
  {
    term: 'Visit duration',
    text: 'The average time from the start of a visit to its last activity.',
  },
]

function OverviewAbout() {
  return (
    <InfoPopup name="Traffic overview">
      <p className="m-0">
        Counts the center&apos;s public pages only: admin pages, preview sites and bots are left
        out. Bounce rate and visit duration are the exception and include bots.
      </p>
      <dl className="m-0 flex flex-col gap-1.5">
        {STAT_DEFINITIONS.map(({ term, text }) => (
          <div key={term}>
            <dt className="inline font-semibold">{term}: </dt>
            <dd className="m-0 inline">{text}</dd>
          </div>
        ))}
      </dl>
      <p className="m-0 flex flex-col gap-1">
        <DocAnchor
          link={{ label: 'PostHog: sessions', href: 'https://posthog.com/docs/data/sessions' }}
        />
        <DocAnchor
          link={{
            label: 'PostHog: bounce rate',
            href: 'https://posthog.com/docs/web-analytics/dashboard#bounce-rate',
          }}
        />
      </p>
    </InfoPopup>
  )
}

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
        info={<OverviewAbout />}
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
