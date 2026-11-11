'use client'

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

/** Names the period the percentages compare against, once for the whole row. */
function ComparisonCaption({ data, range }: { data: OverviewData; range: ReportRange }) {
  const previous = formatDateRange(range.previousFrom, range.previousTo)
  const anyBaseline = METRICS.some((metric) => percentChange(data[metric.key]) !== null)
  return (
    <p className={cn('col-span-full m-0 text-xs', MUTED)}>
      {anyBaseline
        ? `Change compared with the previous period, ${previous}.`
        : `No data from the previous period, ${previous}, to compare with.`}
    </p>
  )
}

export function StatsRow({ state }: { state: ReportState<OverviewData> }) {
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
      {state.status === 'ready' && <ComparisonCaption data={state.data} range={state.range} />}
      {state.status === 'error' && (
        <p className={cn('col-span-full m-0 text-sm', MUTED)}>{state.message}</p>
      )}
    </div>
  )
}
