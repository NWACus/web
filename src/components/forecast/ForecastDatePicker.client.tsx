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
import { parseISO, startOfMonth } from 'date-fns'
import { CalendarX, History, Loader2, MapPin } from 'lucide-react'
import Link from 'next/link'
import { createContext, useContext, useId, useMemo, useState, type ComponentProps } from 'react'
import type { DayButton } from 'react-day-picker'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  dangerColor,
  dangerLevelFromRating,
  dangerName,
  dangerTextColor,
} from '@/services/nac/dangerScale'
import { ARCHIVE_PATH } from '@/services/nac/forecastArchive'
import { cn } from '@/utilities/ui'

import { DangerTriangle } from './DangerTriangle'
import {
  DAY_CELL,
  DatePickerBar,
  DatePickerPopover,
  MutedDay,
  useFlashMessage,
  useMonthLoader,
} from './DatePickerParts.client'
import {
  adjacentForecastHrefs,
  dayKey,
  fetchArchiveMonth,
  forecastHref,
  mergeDays,
  monthKey,
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
 * component (no remount per render) while reading the live day map and link targets.
 */
const DayLinkContext = createContext<{
  days: Map<string, ForecastArchiveDate>
  loadedMonths: Set<string>
  hrefFor: (date: string) => string
  shownDate: string | null
  onEmptyDay: () => void
}>({
  days: new Map(),
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
  const { days, loadedMonths, hrefFor, shownDate, onEmptyDay } = useContext(DayLinkContext)
  const key = dayKey(day.date)
  const forecastDay = days.get(key)

  if (!forecastDay) {
    if (!loadedMonths.has(monthKey(day.date)) || key > dayKey(new Date())) {
      return <MutedDay date={day.date} className={className} />
    }
    return <EmptyDay date={day.date} onPick={onEmptyDay} className={className} />
  }

  return (
    <DangerDay
      date={day.date}
      href={hrefFor(key)}
      day={forecastDay}
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

/**
 * A day that has a product: a link colored by its danger rating, previewing that day's danger
 * while hovered or focused (the widget's day popover).
 */
function DangerDay({
  date,
  href,
  day,
  isChosen,
  className,
}: {
  date: Date
  href: string
  day: ForecastArchiveDate
  isChosen: boolean
  className?: string
}) {
  const level = dangerLevelFromRating(day.dangerRating)
  const previewId = useId()

  return (
    <span className="group/preview relative block h-full w-full">
      <Link
        href={href}
        prefetch={false}
        aria-label={date.toDateString()}
        aria-describedby={previewId}
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
      <DayPreview id={previewId} day={day} />
    </span>
  )
}

/**
 * The hover/focus preview: the rating in words, then a small elevation triangle of the day's
 * danger — or "No Danger Rating", as the widget shows for a rating of 0 or below, or a product
 * with no danger. Hidden until its day is hovered or focused; screen readers get the same text
 * through the day's `aria-describedby`.
 */
function DayPreview({ id, day }: { id: string; day: ForecastArchiveDate }) {
  const danger = day.dangerRating > 0 ? day.danger : null
  const label = day.dangerLevelText ?? dangerName(dangerLevelFromRating(day.dangerRating))

  return (
    <span
      id={id}
      role="tooltip"
      className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 hidden -translate-x-1/2 flex-col items-center gap-1 whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md group-focus-within/preview:flex group-hover/preview:flex"
    >
      <span className="font-semibold capitalize">{label}</span>
      {danger ? (
        <DangerTriangle
          upper={dangerLevelFromRating(danger.upper ?? 0)}
          middle={dangerLevelFromRating(danger.middle ?? 0)}
          lower={dangerLevelFromRating(danger.lower ?? 0)}
          className="h-9 w-8"
        />
      ) : (
        <span>No Danger Rating</span>
      )}
    </span>
  )
}

/**
 * The accumulated date → day map, plus lazy-loading of months the user pages into.
 */
function useForecastArchive(
  center: string,
  zoneSlug: string,
  initialDates: ForecastArchiveDate[],
  initialRange: { from: string; to: string },
) {
  const [days, setDays] = useState<Map<string, ForecastArchiveDate>>(
    () => new Map(initialDates.map((d) => [d.date, d])),
  )
  const { loadedMonths, loading, loadMonth } = useMonthLoader(
    initialRange,
    (from, to) => fetchArchiveMonth(center, zoneSlug, from, to),
    (fetched) => setDays((prev) => mergeDays(prev, fetched)),
  )

  return { days, loadedMonths, loading, loadMonth }
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
  const { days, loadedMonths, loading, loadMonth } = useForecastArchive(
    center,
    zoneSlug,
    initialDates,
    initialRange,
  )

  // The date currently shown (live page falls back to the current product's date).
  const shownDate = selectedDate ?? currentDate
  const hrefFor = (date: string) => forecastHref(basePath, currentDate, date)

  const loadedDates = useMemo(() => Array.from(days.keys()), [days])
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
        days={days}
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
  days: Map<string, ForecastArchiveDate>
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
  days,
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
    days,
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
