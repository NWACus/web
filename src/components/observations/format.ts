/**
 * How the observation viewer writes dates and times. Plain dates (an observation's day, an
 * avalanche's occurrence) are calendar days with no instant behind them, so they are formatted as
 * they are; a submission time is an instant, shown in the center's timezone (#1175). The widget
 * used the reader's browser time for both — a recorded divergence.
 */
import { format } from 'date-fns/format'
import { isValid } from 'date-fns/isValid'
import { parseISO } from 'date-fns/parseISO'

import { formatDateTime } from '@/utilities/formatDateTime'

/** `2026-03-15` → "Mar 15, 2026"; anything unparseable is shown as it came. */
export function formatDay(date: string | null): string {
  if (!date) return ''
  const parsed = parseISO(date.slice(0, 10))
  return isValid(parsed) ? format(parsed, 'MMM d, yyyy') : date
}

/** A submission instant, e.g. "Mar 15, 2026 - 5:06PM", in the center's timezone. */
export function formatSubmitted(instant: string, timezone: string): string {
  const parsed = parseISO(instant)
  return isValid(parsed) ? formatDateTime(instant, timezone, 'MMM d, yyyy - h:mma') : instant
}

/** A stored `HH:mm:ss±zz` time of day as `HH:mm`, as the widget shows it. */
export function formatTimeOfDay(time: string): string {
  return time.split(':').slice(0, 2).join(':')
}

/** Hours in half steps as the form wrote them: `7` → "7:00", `7.5` → "7:30". */
export function formatHalfHour(value: number): string {
  const hours = Math.trunc(value)
  return `${hours}:${value === hours ? '00' : '30'}`
}

/** "public" → "Public", as the widget capitalizes observer types. */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}
