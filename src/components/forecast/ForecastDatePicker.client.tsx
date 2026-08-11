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
 * programmatic `router.push`. The dated route resolves the date to a product id server-side.
 *
 * The pure decisions (month windows, link targets, arrow stepping) live in
 * `./datePickerNavigation` so they can be unit-tested without React.
 */
import { endOfMonth, format, parseISO, startOfMonth } from 'date-fns'
import { CalendarIcon, ChevronLeft, ChevronRight, Loader2, MapPin } from 'lucide-react'
import Link from 'next/link'
import { createContext, useContext, useMemo, useState, type ComponentProps } from 'react'
import type { DayButton } from 'react-day-picker'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { dangerColor, dangerLevelFromRating, dangerTextColor } from '@/services/nac/dangerScale'
import { cn } from '@/utilities/ui'

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
}

// The legacy widget's calendar starts at the 2018-19 season.
const ARCHIVE_START = new Date(2018, 8, 1)

/**
 * Context feeding the custom day renderer, so `DayLink` can stay a stable module-level
 * component (no remount per render) while reading the live ratings map and link targets.
 */
const DayLinkContext = createContext<{
  ratings: Map<string, number>
  hrefFor: (date: string) => string
  shownDate: string | null
}>({ ratings: new Map(), hrefFor: () => '#', shownDate: null })

const DAY_CELL =
  'flex aspect-square h-full w-full min-w-[--cell-size] items-center justify-center rounded-md text-sm'

/** Renders a calendar day as a danger-colored Link (or a muted, non-interactive cell if no product). */
function DayLink({ day, className }: ComponentProps<typeof DayButton>) {
  const { ratings, hrefFor, shownDate } = useContext(DayLinkContext)
  const key = dayKey(day.date)
  const rating = ratings.get(key)

  if (rating === undefined) {
    return (
      <span className={cn(DAY_CELL, 'text-muted-foreground opacity-40', className)}>
        {day.date.getDate()}
      </span>
    )
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

  return { ratings, loading, loadMonth }
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
}: ForecastDatePickerProps) {
  const { ratings, loading, loadMonth } = useForecastArchive(
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
    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
      <div className="inline-flex w-full items-stretch sm:w-auto">
        <ArrowLink href={olderHref} label="Older forecast" side="left" />

        <CalendarPopover
          zoneName={zoneName}
          basePath={basePath}
          selectedDate={selectedDate}
          currentDate={currentDate}
          shownDate={shownDate}
          ratings={ratings}
          hrefFor={hrefFor}
          loading={loading}
          loadMonth={loadMonth}
        />

        <ArrowLink href={newerHref} label="Newer forecast" side="right" />
      </div>
    </div>
  )
}

/** The trigger button and the danger-colored calendar it opens. */
function CalendarPopover({
  zoneName,
  basePath,
  selectedDate,
  currentDate,
  shownDate,
  ratings,
  hrefFor,
  loading,
  loadMonth,
}: {
  zoneName: string
  basePath: string
  selectedDate: string | null
  currentDate: string | null
  shownDate: string | null
  ratings: Map<string, number>
  hrefFor: (date: string) => string
  loading: boolean
  loadMonth: (target: Date) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const showBackToCurrent = Boolean(selectedDate && currentDate)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="flex-1 justify-center gap-2 rounded-none sm:w-56 sm:flex-none"
        >
          <CalendarIcon className="h-4 w-4" />
          {triggerLabel(selectedDate)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="center">
        <ZoneHeading zoneName={zoneName} />
        <DangerCalendar
          shownDate={shownDate}
          ratings={ratings}
          hrefFor={hrefFor}
          loading={loading}
          loadMonth={loadMonth}
        />
        {showBackToCurrent && <BackToCurrentLink basePath={basePath} />}
      </PopoverContent>
    </Popover>
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

/** Shown only on a dated page: a way back to the live forecast. */
function BackToCurrentLink({ basePath }: { basePath: string }) {
  return (
    <div className="border-t p-1">
      <Button asChild variant="ghost" className="w-full justify-center">
        <Link href={basePath}>Current forecast</Link>
      </Button>
    </div>
  )
}

/** The month grid itself: days colored by danger, with a spinner while a month loads. */
function DangerCalendar({
  shownDate,
  ratings,
  hrefFor,
  loading,
  loadMonth,
}: {
  shownDate: string | null
  ratings: Map<string, number>
  hrefFor: (date: string) => string
  loading: boolean
  loadMonth: (target: Date) => Promise<void>
}) {
  const [month, setMonth] = useState<Date>(() =>
    startOfMonth(shownDate ? parseISO(shownDate) : new Date()),
  )

  const handleMonthChange = (next: Date) => {
    setMonth(next)
    void loadMonth(next)
  }

  return (
    <div className="relative">
      <DayLinkContext.Provider value={{ ratings, hrefFor, shownDate }}>
        {/* mode="single" makes react-day-picker render an interactive DayButton per day
            (our DayLink); without a mode it renders plain, non-interactive text. */}
        <Calendar
          mode="single"
          month={month}
          onMonthChange={handleMonthChange}
          startMonth={ARCHIVE_START}
          endMonth={new Date()}
          components={{ DayButton: DayLink }}
        />
      </DayLinkContext.Provider>
      {loading && (
        <div className="bg-background/60 absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}
    </div>
  )
}

/** An arrow as a Link (so the global top-loader fires), or a disabled button at the edge. */
function ArrowLink({
  href,
  label,
  side,
}: {
  href: string | undefined
  label: string
  side: 'left' | 'right'
}) {
  const rounded = side === 'left' ? 'rounded-r-none border-r-0' : 'rounded-l-none border-l-0'
  const Icon = side === 'left' ? ChevronLeft : ChevronRight

  if (!href) {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={label}
        className={rounded}
        disabled
      >
        <Icon className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <Button asChild variant="outline" size="icon" aria-label={label} className={rounded}>
      <Link href={href}>
        <Icon className="h-4 w-4" />
      </Link>
    </Button>
  )
}
