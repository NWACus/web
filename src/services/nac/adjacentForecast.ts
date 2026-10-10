/**
 * Finding a zone's next older or newer forecast past the months the date picker has loaded, so its
 * arrows can step across a season gap the way the widget's do (it holds the whole product list).
 *
 * The search walks calendar months outward from the shown date — the same one-month windows the
 * picker's calendar asks for, so the two share cache entries — and stops at the first month that
 * holds a product. It is bounded by the calendar's own range: never before the calendar start, and
 * never past tomorrow (an evening forecast is valid for the next day). The fetch is injected so
 * the walk is unit-testable without the network. The dated page walks it too, to find a long
 * summary that covers a day from before the months the page loads.
 */
import { addDays } from 'date-fns/addDays'
import { addMonths } from 'date-fns/addMonths'
import { endOfMonth } from 'date-fns/endOfMonth'
import { format } from 'date-fns/format'
import { parseISO } from 'date-fns/parseISO'
import { startOfMonth } from 'date-fns/startOfMonth'

import { coversDay, isCalendarDate, type ZoneArchiveDate } from './archiveDates'

export type AdjacentDirection = 'older' | 'newer'

export interface AdjacentQuery {
  zoneSlug: string
  date: string
  direction: AdjacentDirection
}

/** Validate the `zone`/`date`/`dir` query; `null` means answer 400. */
export function parseAdjacentQuery(
  zoneSlug: string | null,
  date: string | null,
  direction: string | null,
): AdjacentQuery | null {
  if (!zoneSlug || !date || !isCalendarDate(date)) return null
  if (direction !== 'older' && direction !== 'newer') return null

  return { zoneSlug, date, direction }
}

export interface MonthWindow {
  from: string
  to: string
}

/** Months fetched at once. Enough to cross an off-season gap in one round. */
const MONTHS_PER_ROUND = 6

/**
 * The month windows to search, nearest first: from the shown date's month toward `bound` (the
 * calendar start when looking older, the latest possible valid date when looking newer).
 */
export function adjacentSearchWindows(
  date: string,
  direction: AdjacentDirection,
  bound: string,
): MonthWindow[] {
  const step = direction === 'older' ? -1 : 1
  const last = startOfMonth(parseISO(bound)).getTime()
  const windows: MonthWindow[] = []

  let cursor = startOfMonth(parseISO(date))
  while (direction === 'older' ? cursor.getTime() >= last : cursor.getTime() <= last) {
    windows.push({
      from: format(cursor, 'yyyy-MM-dd'),
      to: format(endOfMonth(cursor), 'yyyy-MM-dd'),
    })
    cursor = addMonths(cursor, step)
  }

  return windows
}

/**
 * The nearest date strictly beyond `date` in `direction`, among those inside `window`. Dates the
 * window didn't ask for are ignored, so an upstream that answers more than it was asked can't
 * make the search skip a nearer month.
 */
export function nearestDate(
  dates: string[],
  date: string,
  direction: AdjacentDirection,
  window: MonthWindow,
): string | null {
  const beyond = dates.filter(
    (d) => d >= window.from && d <= window.to && (direction === 'older' ? d < date : d > date),
  )
  if (beyond.length === 0) return null

  beyond.sort()
  return direction === 'older' ? beyond[beyond.length - 1] : beyond[0]
}

/**
 * Whether `date` lies within the calendar the picker offers. The search walks month by month from
 * `date`, so a date far outside it would walk hundreds of empty months, each a cold upstream read;
 * the picker never asks outside it, so anything else is refused before any upstream call.
 */
export function isWithinCalendar(date: string, calendarStart: string, latest: string): boolean {
  return date >= calendarStart && date <= latest
}

/** The latest valid date that can exist now: tomorrow, for a forecast published this evening. */
export function latestValidDate(now: Date = new Date()): string {
  return format(addDays(now, 1), 'yyyy-MM-dd')
}

/**
 * Walk the windows in rounds of MONTHS_PER_ROUND, fetched together, and answer with the nearest
 * date in the first round that has one; `null` when the bound is reached with nothing found. A
 * failed fetch rejects rather than reading as an empty month — "no older forecast" is an answer
 * the picker acts on, and an outage must not be mistaken for it.
 */
export async function findAdjacentDate({
  date,
  direction,
  bound,
  fetchDates,
}: {
  date: string
  direction: AdjacentDirection
  bound: string
  fetchDates: (window: MonthWindow) => Promise<string[]>
}): Promise<string | null> {
  const windows = adjacentSearchWindows(date, direction, bound)

  for (let start = 0; start < windows.length; start += MONTHS_PER_ROUND) {
    const round = windows.slice(start, start + MONTHS_PER_ROUND)
    const found = await Promise.all(
      round.map(async (window) => nearestDate(await fetchDates(window), date, direction, window)),
    )
    const nearest = found.find((d) => d !== null)
    if (nearest) return nearest
  }

  return null
}

/**
 * The covering product for a day whose dated page loaded nothing earlier than it: the zone's
 * nearest older product, found by the arrows' month walk back from `windowStart`, if it was still
 * valid when the day began. A summary can outlast the page's two-month window — a 09-15 summary
 * valid to 11-21 covers 11-10, whose window starts 10-01. Rejects when a month can't be read.
 */
export async function findCoveringDateBeforeWindow({
  date,
  windowStart,
  calendarStart,
  timezone,
  fetchEntries,
}: {
  date: string
  windowStart: string
  calendarStart: string
  timezone: string | null | undefined
  fetchEntries: (window: MonthWindow) => Promise<ZoneArchiveDate[]>
}): Promise<string | null> {
  const seen = new Map<string, ZoneArchiveDate>()
  const older = await findAdjacentDate({
    date: windowStart,
    direction: 'older',
    bound: calendarStart,
    fetchDates: async (window) => {
      const entries = await fetchEntries(window)
      for (const entry of entries) seen.set(entry.date, entry)
      return entries.map((entry) => entry.date)
    },
  })

  const nearest = older ? seen.get(older) : undefined
  return nearest && coversDay(nearest, date, timezone) ? nearest.date : null
}
