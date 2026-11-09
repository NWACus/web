'use client'

import { cn } from '@/utilities/ui'
import type { ReactNode } from 'react'
import { formatCompact, formatPercent } from '../format'
import { MUTED } from './Panel'

export type BarListRow = {
  key: string
  label: ReactNode
  title?: string
  value: number
  /** Extra right-hand cells after the value. */
  extra?: ReactNode[]
}

/**
 * Plausible-style rows: the bar is each row's share of the largest row, the percentage is its
 * share of `total` (the period's visitors) when known.
 */
export function BarList({
  rows,
  headers,
  total,
}: {
  rows: BarListRow[]
  headers: { label: string; value: string; extra?: string[] }
  total?: number
}) {
  const max = Math.max(...rows.map((row) => row.value), 1)
  const extraCount = headers.extra?.length ?? 0
  return (
    <div className="flex flex-col gap-1 text-sm">
      <div className={cn('flex items-center gap-3 text-xs', MUTED)}>
        <span className="flex-1">{headers.label}</span>
        <span className="w-14 text-right">{headers.value}</span>
        {headers.extra?.map((header) => (
          <span key={header} className="w-14 text-right">
            {header}
          </span>
        ))}
        {total !== undefined && <span className="w-14 text-right">%</span>}
      </div>
      {rows.map((row) => (
        <div key={row.key} className="flex items-center gap-3">
          <div className="relative min-w-0 flex-1 rounded">
            <div
              className="absolute inset-y-0 left-0 rounded bg-[var(--theme-elevation-100)]"
              style={{ width: `${(row.value / max) * 100}%` }}
            />
            <div className="relative truncate px-2 py-1" title={row.title}>
              {row.label}
            </div>
          </div>
          <span className="w-14 text-right tabular-nums" title={row.value.toLocaleString('en-US')}>
            {formatCompact(row.value)}
          </span>
          {Array.from({ length: extraCount }, (_, i) => (
            <span key={i} className="w-14 text-right tabular-nums">
              {row.extra?.[i] ?? ''}
            </span>
          ))}
          {total !== undefined && (
            <span className={cn('w-14 text-right tabular-nums', MUTED)}>
              {total > 0 ? formatPercent(row.value / total) : ''}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
