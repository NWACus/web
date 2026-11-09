'use client'

import type { Comparison, OverviewData, PanelData } from '@/services/posthog/panelTypes'
import { cn } from '@/utilities/ui'
import { ShimmerEffect } from '@payloadcms/ui'
import { formatDecimal, formatDelta, formatDuration, formatInteger, formatPercent } from '../format'
import type { PanelState } from '../usePanel'
import { MUTED } from './Panel'

export const pickOverview = (data: PanelData): OverviewData | null =>
  data.kind === 'overview' ? data : null

type Metric = {
  key: keyof Omit<OverviewData, 'kind'>
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
  none: MUTED,
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
      <span className={cn('text-xs tabular-nums', DELTA_CLASS[delta.direction])}>{delta.text}</span>
    </div>
  )
}

export function StatsRow({ state }: { state: PanelState<OverviewData> }) {
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
      {state.status === 'error' && (
        <p className={cn('col-span-full m-0 text-sm', MUTED)}>{state.message}</p>
      )}
    </div>
  )
}
