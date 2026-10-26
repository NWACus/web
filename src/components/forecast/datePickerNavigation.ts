/**
 * Pure decisions behind the forecast date picker: which months a window covers, where a day
 * links to, and which dates the prev/next arrows step to. Kept free of React and network so the
 * branching is unit-testable — the picker components then only render.
 */
import { addMonths, format, parseISO, startOfMonth } from 'date-fns'

import type { AdjacentDirection } from '@/services/nac/adjacentForecast'
import type { ZoneArchiveDate } from '@/services/nac/archiveDates'

/** One day the picker can show: its color, and the preview a hover or focus reveals. */
export type ForecastArchiveDate = Pick<
  ZoneArchiveDate,
  'date' | 'dangerRating' | 'dangerLevelText' | 'danger'
>

export const dayKey = (date: Date) => format(date, 'yyyy-MM-dd')
export const monthKey = (date: Date) => format(date, 'yyyy-MM')

/** Every `YYYY-MM` month touched by the inclusive `from`..`to` window. */
export function monthsBetween(from: string, to: string): string[] {
  const months: string[] = []
  let cursor = startOfMonth(parseISO(from))
  const end = startOfMonth(parseISO(to))
  while (cursor <= end) {
    months.push(monthKey(cursor))
    cursor = addMonths(cursor, 1)
  }
  return months
}

/**
 * Where a calendar day links to. Selecting the current product's date returns to the live page;
 * any other date gets the dated route.
 */
export function forecastHref(basePath: string, currentDate: string | null, date: string): string {
  return currentDate && date === currentDate ? basePath : `${basePath}/${date}`
}

/** Fold a freshly fetched month's days into the accumulated map. */
export function mergeDays(
  previous: Map<string, ForecastArchiveDate>,
  fetched: ForecastArchiveDate[],
): Map<string, ForecastArchiveDate> {
  const next = new Map(previous)
  for (const d of fetched) next.set(d.date, d)
  return next
}

/**
 * The targets for the prev/next arrows: the adjacent loaded dates that have a product. The
 * calendar handles larger jumps and lazy-loads colors, so an arrow is simply absent (disabled)
 * when there is no loaded neighbour that way. "Newer" is always absent on the live page.
 */
export function adjacentForecastHrefs(
  loadedDates: string[],
  shownDate: string | null,
  currentDate: string | null,
  basePath: string,
): { olderHref: string | undefined; newerHref: string | undefined } {
  if (!shownDate) return { olderHref: undefined, newerHref: undefined }

  const sorted = [...loadedDates].sort()
  const olderDate = [...sorted].reverse().find((d) => d < shownDate)
  const newerDate = sorted.find((d) => d > shownDate)
  const atCurrent = currentDate !== null && shownDate === currentDate

  return {
    olderHref: olderDate ? forecastHref(basePath, currentDate, olderDate) : undefined,
    newerHref: atCurrent || !newerDate ? undefined : forecastHref(basePath, currentDate, newerDate),
  }
}

/** Every month from `from` to `to` is loaded, so a date missing from them doesn't exist. */
function allMonthsLoaded(loadedMonths: Set<string>, from: string, to: string): boolean {
  return monthsBetween(from, to).every((month) => loadedMonths.has(month))
}

export interface ArrowPlan {
  olderHref: string | undefined
  newerHref: string | undefined
  /** No loaded date that way, but unloaded months remain: ask the server on click. */
  lookOlder: boolean
  lookNewer: boolean
}

/**
 * The forecast picker's arrows. A loaded neighbour is a plain link; past the loaded months the
 * arrow stays enabled and looks the neighbour up on click, so it steps across a season gap the way
 * the widget's do. It is disabled only once every month to the calendar's edge that way is loaded
 * and holds nothing — `calendarStart` going older, `latest` (tomorrow) going newer — or, for
 * newer, on the live page.
 */
export function forecastArrowPlan({
  loadedDates,
  loadedMonths,
  shownDate,
  currentDate,
  basePath,
  calendarStart,
  latest,
}: {
  loadedDates: string[]
  loadedMonths: Set<string>
  shownDate: string | null
  currentDate: string | null
  basePath: string
  calendarStart: string
  latest: string
}): ArrowPlan {
  const { olderHref, newerHref } = adjacentForecastHrefs(
    loadedDates,
    shownDate,
    currentDate,
    basePath,
  )
  if (!shownDate) return { olderHref, newerHref, lookOlder: false, lookNewer: false }

  const atCurrent = currentDate !== null && shownDate === currentDate

  return {
    olderHref,
    newerHref,
    lookOlder: !olderHref && !allMonthsLoaded(loadedMonths, calendarStart, shownDate),
    lookNewer: !newerHref && !atCurrent && !allMonthsLoaded(loadedMonths, shownDate, latest),
  }
}

/**
 * Where an arrow lookup leads. A found date links like any other day. With nothing newer in the
 * archive, a newer step still reaches the live page when the current product is newer than the
 * shown one (the archive list can trail a fresh publish). `null` answers mean the request failed.
 */
export function lookupOutcome(
  answer: { date: string | null } | null,
  direction: AdjacentDirection,
  shownDate: string,
  currentDate: string | null,
  basePath: string,
): { href: string } | 'none' | 'failed' {
  if (!answer) return 'failed'
  if (answer.date) return { href: forecastHref(basePath, currentDate, answer.date) }
  if (direction === 'newer' && currentDate && currentDate > shownDate) return { href: basePath }
  return 'none'
}

/**
 * Ask the server for the zone's next forecast date past the loaded months. `null` when the
 * request fails, so the arrow stays enabled for another try.
 */
export async function fetchAdjacentDate(
  center: string,
  zoneSlug: string,
  date: string,
  direction: AdjacentDirection,
): Promise<{ date: string | null } | null> {
  try {
    const res = await fetch(
      // Encoded for the same `&`-carrying slugs as fetchArchiveMonth.
      `/api/${center}/forecast-archive/adjacent?zone=${encodeURIComponent(zoneSlug)}&date=${date}&dir=${direction}`,
    )
    if (!res.ok) return null
    const body: { date?: string | null } = await res.json()
    return { date: body.date ?? null }
  } catch {
    return null
  }
}

/** The label on the picker's trigger button. */
export function triggerLabel(selectedDate: string | null): string {
  return selectedDate ? format(parseISO(selectedDate), 'MMM d, yyyy') : 'Current forecast'
}

/**
 * Fetch one month of archive dates. Returns `null` when the request fails, which the caller
 * treats as "leave the month unloaded so it can be retried".
 */
export async function fetchArchiveMonth(
  center: string,
  zoneSlug: string,
  from: string,
  to: string,
): Promise<ForecastArchiveDate[] | null> {
  try {
    const res = await fetch(
      // Encoded because the slug carries a literal `&` for zones whose name contains one,
      // which would otherwise end the query parameter early.
      `/api/${center}/forecast-archive?zone=${encodeURIComponent(zoneSlug)}&from=${from}&to=${to}`,
    )
    if (!res.ok) return null
    const body: { dates?: ForecastArchiveDate[] } = await res.json()
    return body.dates ?? []
  } catch {
    return null
  }
}
