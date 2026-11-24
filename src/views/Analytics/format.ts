import type { Comparison } from '@/services/posthog/reportTypes'
import { percentChange } from '@/services/posthog/reportTypes'

const integer = new Intl.NumberFormat('en-US')
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })
const percent = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 })
const percentFine = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 2 })
const decimal = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

export const formatInteger = (value: number) => integer.format(value)
export const formatCompact = (value: number) => compact.format(value)
export const formatPercent = (value: number) => percent.format(value)
export const formatPercentFine = (value: number) => percentFine.format(value)
export const formatDecimal = (value: number) => decimal.format(value)

/** Plausible-style "4m 12s". */
export function formatDuration(seconds: number): string {
  const whole = Math.round(seconds)
  if (whole < 60) return `${whole}s`
  const minutes = Math.floor(whole / 60)
  if (minutes < 60) return `${minutes}m ${whole % 60}s`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

export type Delta = { text: string; direction: 'up' | 'down' | 'flat' }

function deltaDirection(rounded: number, invert: boolean): Delta['direction'] {
  if (rounded === 0) return 'flat'
  const better = invert ? rounded < 0 : rounded > 0
  return better ? 'up' : 'down'
}

/** `invert` for metrics where down is good, like bounce rate. Null when there is no baseline. */
export function formatDelta(comparison: Comparison, invert = false): Delta | null {
  const change = percentChange(comparison)
  if (change === null) return null
  const rounded = Math.round(change)
  const sign = rounded > 0 ? '+' : ''
  return { text: `${sign}${rounded}%`, direction: deltaDirection(rounded, invert) }
}

/** "Nov 1 – Nov 9, 2026", or "Nov 9, 2025 – Nov 9, 2026" across years, without timezone shifts. */
export function formatDateRange(from: string, to: string): string {
  const day = (iso: string, withYear: boolean) =>
    new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
      ...(withYear ? { year: 'numeric' } : {}),
    })
  if (from === to) return day(from, true)
  const sameYear = from.slice(0, 4) === to.slice(0, 4)
  return `${day(from, !sameYear)} – ${day(to, true)}`
}
