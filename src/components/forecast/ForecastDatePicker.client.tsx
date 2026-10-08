'use client'

/**
 * Date navigation for the native forecast page: a calendar whose days are colored by that
 * day's avalanche danger rating (matching the legacy widget), plus prev/next stepping. Built
 * for season-replay browsing. The server seeds an initial month window; the calendar
 * lazy-loads older months' danger colors on demand from `/api/{center}/forecast-archive` so
 * the page never ships the full ~9.6k-product archive.
 *
 * Each day (and the arrows) is a real Next `<Link>` to the dated route, so navigation uses the
 * app's global `nextjs-toploader` progress bar — the bar only starts on anchor clicks, not on
 * programmatic `router.push`. The dated route resolves the date to a product id server-side. A day
 * with no product is a button that says so briefly, as the legacy widget's calendar does.
 *
 * The pure decisions (month windows, link targets, arrow stepping) live in
 * `./datePickerNavigation` so they can be unit-tested without React.
 */
import { endOfMonth, format, parseISO, startOfMonth } from 'date-fns'
import { CalendarX, History, Loader2, MapPin } from 'lucide-react'
import Link from 'next/link'
import { createContext, useContext, useMemo, useState, type ComponentProps } from 'react'
import type { DayButton } from 'react-day-picker'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { dangerColor, dangerLevelFromRating, dangerTextColor } from '@/services/nac/dangerScale'
import { ARCHIVE_PATH } from '@/services/nac/forecastArchive'
import { cn } from '@/utilities/ui'

import {
  DAY_CELL,
  DatePickerBar,
  DatePickerPopover,
  MutedDay,
  useFlashMessage,
} from './DatePickerParts.client'
import {
  adjacentForecastHrefs,
  dayKey,
  fetchArchiveMonth,
  forecastHref,
  mergeRatings,
  monthKey,
  monthsBetween,
  triggerLabel,
  type ForecastArchiveDate,
} from './datePickerNavigation'

interface ForecastDatePickerProps {
  center: string
  zoneSlug: string
  zoneName: string
  /** Tenant-relative zone base path, e.g. `/forecasts/avalanche/west-slopes-north`. */
  basePath: string
  /** The shown date (`YYYY-MM-DD`), or null when showing the current/live forecast. */
  selectedDate: string | null
  /** Valid date of the current/live product; its link points to the live page. */
  currentDate: string | null
  /** Dates (with danger) for the server-rendered initial window. */
  initialDates: ForecastArchiveDate[]
  /** The `from`/`to` (YYYY-MM-DD) window covered by initialDates. */
  initialRange: { from: string; to: string }
  /** First day the calendar offers (`YYYY-MM-DD`), from the center's `start_year`. */
  calendarStart: string
  /** Name the zone in the dropdown; the widget does only when the center has several. */
  showZoneName: boolean
}

/** How long the "nothing found" notice stays up — the legacy widget's 1.5 seconds. */
const NOTICE_MS = 1500

const NOTHING_FOUND = 'Nothing found for the selected date and forecast zone'

/**
 * Context feeding the custom day renderer, so `DayLink` can stay a stable module-level
 * component (no remount per render) while reading the live ratings map and link targets.
 */
const DayLinkContext = createContext<{
  ratings: Map<string, number>
  loadedMonths: Set<string>
  hrefFor: (date: string) => string
  shownDate: string | null
  onEmptyDay: () => void
}>({
  ratings: new Map(),
  loadedMonths: new Set(),
  hrefFor: () => '#',
  shownDate: null,
  onEmptyDay: () => {},
})

/**
 * Renders a calendar day as a danger-colored Link. A day with no product says so when picked, as
 * the widget's does; it stays muted and inert only while its month is unloaded (we can't yet tell
 * that it is empty) or while it is still in the future.
 */
function DayLink({ day, className }: ComponentProps<typeof DayButton>) {
  const { ratings, loadedMonths, hrefFor, shownDate, onEmptyDay } = useContext(DayLinkContext)
  const key = dayKey(day.date)
  const rating = ratings.get(key)

  if (rating === undefined) {
    if (!loadedMonths.has(monthKey(day.date)) || key > dayKey(new Date())) {
      return <MutedDay date={day.date} className={className} />
    }
    return <EmptyDay date={day.date} onPick={onEmptyDay} className={className} />
  }

  return (
    <DangerDay
      date={day.date}
      href={hrefFor(key)}
      rating={rating}
      isChosen={key === shownDate}
      className={className}
    />
  )
}

/** A day with no product: pickable, and answered with the "nothing found" notice. */
function EmptyDay({
  date,
  onPick,
  className,
}: {
  date: Date
  onPick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      aria-label={date.toDateString()}
      className={cn(DAY_CELL, 'text-muted-foreground hover:bg-accent', className)}
    >
      {date.getDate()}
    </button>
  )
}

/** A day that has a product: a link colored by its danger rating. */
function DangerDay({
  date,
  href,
  rating,
  isChosen,
  className,
}: {
  date: Date
  href: string
  rating: number
  isChosen: boolean
  className?: string
}) {
  const level = dangerLevelFromRating(rating)

  return (
    <Link
      href={href}
      prefetch={false}
      aria-label={date.toDateString()}
      aria-current={isChosen ? 'date' : undefined}
      className={cn(DAY_CELL, isChosen && 'font-bold', className)}
      style={{
        backgroundColor: dangerColor(level),
        color: dangerTextColor(level),
        outline: isChosen ? '2px solid #2563eb' : undefined,
        outlineOffset: '-2px',
      }}
    >
      {date.getDate()}
    </Link>
  )
}

/**
 * The accumulated date → danger-rating map, plus lazy-loading of months the user pages into.
 */
function useForecastArchive(
  center: string,
  zoneSlug: string,
  initialDates: ForecastArchiveDate[],
  initialRange: { from: string; to: string },
) {
  const [ratings, setRatings] = useState<Map<string, number>>(
    () => new Map(initialDates.map((d) => [d.date, d.dangerRating])),
  )
  const [loadedMonths, setLoadedMonths] = useState<Set<string>>(
    () => new Set(monthsBetween(initialRange.from, initialRange.to)),
  )
  const [loading, setLoading] = useState(false)

  const loadMonth = async (target: Date) => {
    const mk = monthKey(target)
    if (loadedMonths.has(mk)) return

    setLoading(true)
    const fetched = await fetchArchiveMonth(
      center,
      zoneSlug,
      format(startOfMonth(target), 'yyyy-MM-dd'),
      format(endOfMonth(target), 'yyyy-MM-dd'),
    )
    // A null result means the request failed; leave the month unloaded so it can be retried.
    if (fetched) {
      setRatings((prev) => mergeRatings(prev, fetched))
      setLoadedMonths((prev) => new Set(prev).add(mk))
    }
    setLoading(false)
  }

  return { ratings, loadedMonths, loading, loadMonth }
}

export function ForecastDatePicker({
  center,
  zoneSlug,
  zoneName,
  basePath,
  selectedDate,
  currentDate,
  initialDates,
  initialRange,
  calendarStart,
  showZoneName,
}: ForecastDatePickerProps) {
  const { ratings, loadedMonths, loading, loadMonth } = useForecastArchive(
    center,
    zoneSlug,
    initialDates,
    initialRange,
  )

  // The date currently shown (live page falls back to the current product's date).
  const shownDate = selectedDate ?? currentDate
  const hrefFor = (date: string) => forecastHref(basePath, currentDate, date)

  const loadedDates = useMemo(() => Array.from(ratings.keys()), [ratings])
  const { olderHref, newerHref } = adjacentForecastHrefs(
    loadedDates,
    shownDate,
    currentDate,
    basePath,
  )

  return (
    <DatePickerBar
      olderHref={olderHref}
      newerHref={newerHref}
      olderLabel="Older forecast"
      newerLabel="Newer forecast"
    >
      <CalendarPopover
        zoneName={showZoneName ? zoneName : null}
        basePath={basePath}
        selectedDate={selectedDate}
        currentDate={currentDate}
        shownDate={shownDate}
        calendarStart={calendarStart}
        ratings={ratings}
        loadedMonths={loadedMonths}
        hrefFor={hrefFor}
        loading={loading}
        loadMonth={loadMonth}
      />
    </DatePickerBar>
  )
}

type CalendarProps = {
  shownDate: string | null
  calendarStart: string
  ratings: Map<string, number>
  loadedMonths: Set<string>
  hrefFor: (date: string) => string
  loading: boolean
  loadMonth: (target: Date) => Promise<void>
}

/**
 * The trigger button and the danger-colored calendar it opens. The button reads the shown
 * product's valid date on the live page too, as the widget's does.
 */
function CalendarPopover({
  zoneName,
  basePath,
  selectedDate,
  currentDate,
  ...calendar
}: CalendarProps & {
  /** Null when the center has a single zone, which the widget doesn't name. */
  zoneName: string | null
  basePath: string
  selectedDate: string | null
  currentDate: string | null
}) {
  const showBackToCurrent = Boolean(selectedDate && currentDate)

  return (
    <DatePickerPopover label={triggerLabel(calendar.shownDate)} tooltip="Choose a date">
      {zoneName && <ZoneHeading zoneName={zoneName} />}
      <DangerCalendar {...calendar} />
      <PopoverFooter basePath={basePath} showBackToCurrent={showBackToCurrent} />
    </DatePickerPopover>
  )
}

function ZoneHeading({ zoneName }: { zoneName: string }) {
  return (
    <div className="flex items-center justify-center gap-1 border-b py-2 text-sm font-semibold">
      <MapPin className="h-4 w-4" />
      {zoneName}
    </div>
  )
}

/**
 * Under the calendar: a way back to the live forecast (dated pages only), and the center-wide
 * archive browser, as the legacy calendar dropdown offers under its calendar.
 */
function PopoverFooter({
  basePath,
  showBackToCurrent,
}: {
  basePath: string
  showBackToCurrent: boolean
}) {
  return (
    <div className="flex flex-col border-t p-1">
      {showBackToCurrent && (
        <Button asChild variant="ghost" className="w-full justify-center">
          <Link href={basePath}>Current forecast</Link>
        </Button>
      )}
      <Button asChild variant="ghost" className="w-full justify-center gap-2">
        <Link href={ARCHIVE_PATH}>
          <History className="h-4 w-4" aria-hidden="true" />
          All archived forecasts
        </Link>
      </Button>
    </div>
  )
}

/**
 * The month grid itself: days colored by danger, with a spinner while a month loads and the
 * "nothing found" notice over it when an empty day is picked.
 */
function DangerCalendar({
  shownDate,
  calendarStart,
  ratings,
  loadedMonths,
  hrefFor,
  loading,
  loadMonth,
}: CalendarProps) {
  const [month, setMonth] = useState<Date>(() =>
    startOfMonth(shownDate ? parseISO(shownDate) : new Date()),
  )
  const [notice, flashNotice] = useFlashMessage(NOTICE_MS)

  const handleMonthChange = (next: Date) => {
    setMonth(next)
    void loadMonth(next)
  }

  const dayContext = {
    ratings,
    loadedMonths,
    hrefFor,
    shownDate,
    onEmptyDay: () => flashNotice(NOTHING_FOUND),
  }

  return (
    <div className="relative">
      <DayLinkContext.Provider value={dayContext}>
        {/* mode="single" makes react-day-picker render an interactive DayButton per day
            (our DayLink); without a mode it renders plain, non-interactive text. */}
        <Calendar
          mode="single"
          month={month}
          onMonthChange={handleMonthChange}
          // A plain calendar day parses as local midnight, so the start can't slip to Aug 31.
          startMonth={parseISO(calendarStart)}
          endMonth={new Date()}
          components={{ DayButton: DayLink }}
        />
      </DayLinkContext.Provider>
      {loading && (
        <div className="bg-background/60 absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}
      <CalendarNotice message={notice} />
    </div>
  )
}

/**
 * Always mounted, so the live region exists before its text arrives and screen readers announce
 * the notice; it covers the calendar only while there is something to say.
 */
function CalendarNotice({ message }: { message: string }) {
  return (
    <div
      role="status"
      className={cn(
        'pointer-events-none absolute inset-0 flex items-center justify-center p-4',
        !message && 'sr-only',
      )}
    >
      {message && (
        <p className="flex flex-col items-center gap-1 rounded-md border bg-background px-4 py-3 text-center text-sm shadow-md">
          <CalendarX className="h-5 w-5" aria-hidden="true" />
          {message}
        </p>
      )}
    </div>
  )
}
