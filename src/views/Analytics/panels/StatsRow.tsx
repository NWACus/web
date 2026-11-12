'use client'

import type { DateRange } from '@/services/posthog/analyticsRange'
import {
  overviewSchema,
  percentChange,
  type Comparison,
  type OverviewData,
  type ReportRange,
} from '@/services/posthog/reportTypes'
import { cn } from '@/utilities/ui'
import { ShimmerEffect } from '@payloadcms/ui'
import {
  formatDateRange,
  formatDecimal,
  formatDelta,
  formatDuration,
  formatInteger,
  formatPercent,
} from '../format'
import { parseWith, type ReportState } from '../useReport'
import { MUTED } from './Panel'

export const parseOverview = parseWith(overviewSchema)

type Metric = {
  key: keyof OverviewData
  label: string
  format: (value: number) => string
  invert?: boolean
}

const METRICS: Metric[] = [
  { key: 'visitors', label: 'Unique visitors', format: formatInteger },
  { key: 'visits', label: 'Total visits', format: formatInteger },
  { key: 'pageviews', label: 'Total pageviews', format: formatInteger },
  { key: 'viewsPerVisit', label: 'Views per visit', format: formatDecimal },
  { key: 'bounceRate', label: 'Bounce rate', format: formatPercent, invert: true },
  { key: 'visitDuration', label: 'Visit duration', format: formatDuration },
]

const DELTA_CLASS = {
  up: 'text-[var(--theme-success-600)]',
  down: 'text-[var(--theme-error-600)]',
  flat: MUTED,
}

function Stat({ metric, comparison }: { metric: Metric; comparison: Comparison }) {
  const delta = formatDelta(comparison, metric.invert)
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className={cn('truncate text-xs font-semibold uppercase tracking-wide', MUTED)}>
        {metric.label}
      </span>
      <span className="text-2xl font-semibold leading-none tabular-nums">
        {metric.format(comparison.current)}
      </span>
      {/* A blank line without a baseline keeps the row aligned; the caption below explains */}
      <span className={cn('text-xs tabular-nums', delta && DELTA_CLASS[delta.direction])}>
        {delta ? delta.text : '\u00a0'}
      </span>
    </div>
  )
}

/** A real link, so it opens in a new tab too, but a plain click switches the range in place. */
function ViewPeriodLink({
  range,
  onView,
}: {
  range: DateRange
  onView: (range: DateRange) => void
}) {
  return (
    <a
      href={`?${new URLSearchParams(range)}`}
      className="text-[inherit] underline underline-offset-2"
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
        event.preventDefault()
        onView(range)
      }}
    >
      View this period
    </a>
  )
}

/** Names the period the percentages compare against, once for the whole row. */
function ComparisonCaption({
  data,
  range,
  onViewPeriod,
}: {
  data: OverviewData
  range: ReportRange
  onViewPeriod: (range: DateRange) => void
}) {
  const previous = formatDateRange(range.previousFrom, range.previousTo)
  const anyBaseline = METRICS.some((metric) => percentChange(data[metric.key]) !== null)
  const period =
    range.baseline === 'yearEarlier' ? 'the same dates a year earlier' : 'the previous period'
  if (!anyBaseline) {
    return (
      <p className={cn('col-span-full m-0 text-xs', MUTED)}>
        No data from {period}, {previous}, to compare with.
      </p>
    )
  }
  return (
    <p className={cn('col-span-full m-0 text-xs', MUTED)}>
      Change compared with {period}, {previous}.{' '}
      <ViewPeriodLink
        range={{ from: range.previousFrom, to: range.previousTo }}
        onView={onViewPeriod}
      />
    </p>
  )
}

export function StatsRow({
  state,
  onViewPeriod,
}: {
  state: ReportState<OverviewData>
  onViewPeriod: (range: DateRange) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-6">
      {METRICS.map((metric) =>
        state.status === 'ready' ? (
          <Stat key={metric.key} metric={metric} comparison={state.data[metric.key]} />
        ) : (
          <div key={metric.key} className="flex flex-col gap-2">
            <ShimmerEffect height="0.75rem" width="70%" />
            <ShimmerEffect height="1.75rem" width="50%" />
          </div>
        ),
      )}
      {state.status === 'ready' && (
        <ComparisonCaption data={state.data} range={state.range} onViewPeriod={onViewPeriod} />
      )}
      {state.status === 'error' && (
        <p className={cn('col-span-full m-0 text-sm', MUTED)}>{state.message}</p>
      )}
    </div>
  )
}
