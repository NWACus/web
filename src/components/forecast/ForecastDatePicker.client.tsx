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
 */
import { addMonths, endOfMonth, format, parseISO, startOfMonth } from 'date-fns'
import { CalendarIcon, ChevronLeft, ChevronRight, Loader2, MapPin } from 'lucide-react'
import Link from 'next/link'
import { createContext, useContext, useMemo, useState, type ComponentProps } from 'react'
import type { DayButton } from 'react-day-picker'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { dangerColor, dangerLevelFromRating, dangerTextColor } from '@/services/nac/dangerScale'
import { cn } from '@/utilities/ui'

export interface ForecastArchiveDate {
  /** `YYYY-MM-DD` valid date. */
  date: string
  /** Overall danger rating (0-5; -1 = general info) for coloring the day. */
  dangerRating: number
}

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

const dayKey = (date: Date) => format(date, 'yyyy-MM-dd')
const monthKey = (date: Date) => format(date, 'yyyy-MM')

function monthsBetween(from: string, to: string): string[] {
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
  const dayNumber = day.date.getDate()

  if (rating === undefined) {
    return (
      <span className={cn(DAY_CELL, 'text-muted-foreground opacity-40', className)}>
        {dayNumber}
      </span>
    )
  }

  const level = dangerLevelFromRating(rating)
  const isChosen = key === shownDate

  return (
    <Link
      href={hrefFor(key)}
      prefetch={false}
      aria-label={day.date.toDateString()}
      aria-current={isChosen ? 'date' : undefined}
      className={cn(DAY_CELL, isChosen && 'font-bold', className)}
      style={{
        backgroundColor: dangerColor(level),
        color: dangerTextColor(level),
        outline: isChosen ? '2px solid #2563eb' : undefined,
        outlineOffset: '-2px',
      }}
    >
      {dayNumber}
    </Link>
  )
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
  // date (YYYY-MM-DD) → danger rating, accumulated as the user pages into new months.
  const [ratings, setRatings] = useState<Map<string, number>>(
    () => new Map(initialDates.map((d) => [d.date, d.dangerRating])),
  )
  const [loadedMonths, setLoadedMonths] = useState<Set<string>>(
    () => new Set(monthsBetween(initialRange.from, initialRange.to)),
  )
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  // The date currently shown (live page falls back to the current product's date).
  const shownDate = selectedDate ?? currentDate
  const [month, setMonth] = useState<Date>(() =>
    shownDate ? startOfMonth(parseISO(shownDate)) : startOfMonth(new Date()),
  )

  // Selecting the current product's date returns to the live page; any other date is dated.
  const hrefFor = (date: string) =>
    currentDate && date === currentDate ? basePath : `${basePath}/${date}`

  const loadMonth = async (target: Date) => {
    const mk = monthKey(target)
    if (loadedMonths.has(mk)) return
    setLoading(true)
    try {
      const from = format(startOfMonth(target), 'yyyy-MM-dd')
      const to = format(endOfMonth(target), 'yyyy-MM-dd')
      const res = await fetch(
        `/api/${center}/forecast-archive?zone=${zoneSlug}&from=${from}&to=${to}`,
      )
      if (!res.ok) return
      const body: { dates?: ForecastArchiveDate[] } = await res.json()
      const fetched = body.dates ?? []
      setRatings((prev) => {
        const next = new Map(prev)
        for (const d of fetched) next.set(d.date, d.dangerRating)
        return next
      })
      setLoadedMonths((prev) => new Set(prev).add(mk))
    } catch {
      // Leave the month unloaded so it can be retried; days stay muted meanwhile.
    } finally {
      setLoading(false)
    }
  }

  const handleMonthChange = (next: Date) => {
    setMonth(next)
    void loadMonth(next)
  }

  // Prev/next step to the adjacent loaded date that has a product (the calendar handles
  // larger jumps and lazy-loads colors). Disabled when there's no loaded neighbor that way.
  const sortedDates = useMemo(() => Array.from(ratings.keys()).sort(), [ratings])
  const olderDate = shownDate ? [...sortedDates].reverse().find((d) => d < shownDate) : undefined
  const newerDate = shownDate ? sortedDates.find((d) => d > shownDate) : undefined
  const atCurrent = currentDate !== null && shownDate === currentDate
  const olderHref = olderDate ? hrefFor(olderDate) : undefined
  const newerHref = atCurrent ? undefined : newerDate ? hrefFor(newerDate) : undefined

  const triggerLabel = selectedDate
    ? format(parseISO(selectedDate), 'MMM d, yyyy')
    : 'Current forecast'

  return (
    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
      <div className="inline-flex w-full items-stretch sm:w-auto">
        <ArrowLink href={olderHref} label="Older forecast" side="left" />

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="flex-1 justify-center gap-2 rounded-none sm:w-56 sm:flex-none"
            >
              <CalendarIcon className="h-4 w-4" />
              {triggerLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <div className="flex items-center justify-center gap-1 border-b py-2 text-sm font-semibold">
              <MapPin className="h-4 w-4" />
              {zoneName}
            </div>
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
            {selectedDate && currentDate && (
              <div className="border-t p-1">
                <Button asChild variant="ghost" className="w-full justify-center">
                  <Link href={basePath}>Current forecast</Link>
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        <ArrowLink href={newerHref} label="Newer forecast" side="right" />
      </div>
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
