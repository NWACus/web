/**
 * Pure decisions behind the forecast date picker: which months a window covers, where a day
 * links to, and which dates the prev/next arrows step to. Kept free of React and network so the
 * branching is unit-testable — the picker components then only render.
 */
import { addMonths, format, parseISO, startOfMonth } from 'date-fns'

export interface ForecastArchiveDate {
  /** `YYYY-MM-DD` valid date. */
  date: string
  /** Overall danger rating (0-5; -1 = general info) for coloring the day. */
  dangerRating: number
}

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

/** Fold a freshly fetched month's ratings into the accumulated map. */
export function mergeRatings(
  previous: Map<string, number>,
  fetched: ForecastArchiveDate[],
): Map<string, number> {
  const next = new Map(previous)
  for (const d of fetched) next.set(d.date, d.dangerRating)
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
