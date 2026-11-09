import type { Comparison } from '@/services/posthog/panelTypes'
import { percentChange } from '@/services/posthog/panelTypes'

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

export type Delta = { text: string; direction: 'up' | 'down' | 'flat' | 'none' }

function deltaDirection(rounded: number, invert: boolean): Delta['direction'] {
  if (rounded === 0) return 'flat'
  const better = invert ? rounded < 0 : rounded > 0
  return better ? 'up' : 'down'
}

/** `invert` for metrics where down is good, like bounce rate. */
export function formatDelta(comparison: Comparison, invert = false): Delta {
  const change = percentChange(comparison)
  if (change === null) return { text: 'no prior data', direction: 'none' }
  const rounded = Math.round(change)
  const sign = rounded > 0 ? '+' : ''
  return { text: `${sign}${rounded}%`, direction: deltaDirection(rounded, invert) }
}

/** "Nov 1 – Nov 9, 2026" from ISO dates, without timezone shifts. */
export function formatDateRange(from: string, to: string): string {
  const day = (iso: string, withYear: boolean) =>
    new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
      ...(withYear ? { year: 'numeric' } : {}),
    })
  return from === to ? day(from, true) : `${day(from, false)} – ${day(to, true)}`
}
