'use client'

/**
 * Steps between the dates with a published Mountain Weather forecast, or picks one from a
 * calendar that offers only those. Looks like the avalanche forecast's picker, without the danger
 * colors, and loads months the same way: the server seeds an initial window, and the calendar
 * fetches further months from `/api/nwac/nwac-weather-dates` as the reader pages into them, so a
 * dated page never ships the whole list. Today lives at `/weather/forecast`; any other date at
 * `/weather/forecast/<date>`.
 */
import { parseISO, startOfMonth } from 'date-fns'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { createContext, useContext, useEffect, useMemo, useState, type ComponentProps } from 'react'
import type { DayButton } from 'react-day-picker'

import {
  DAY_CELL,
  DatePickerBar,
  DatePickerPopover,
  MutedDay,
  useMonthLoader,
} from '@/components/forecast/DatePickerParts.client'
import {
  adjacentForecastHrefs,
  dayKey,
  forecastHref,
  triggerLabel,
} from '@/components/forecast/datePickerNavigation'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/utilities/ui'

const BASE = '/weather/forecast'
const DATES_ENDPOINT = '/api/nwac/nwac-weather-dates'

export function dateHref(date: string, today: string) {
  return forecastHref(BASE, today, date)
}

/** One month's published dates. `null` when the request fails, so the month can be retried. */
async function fetchMonth(from: string, to: string): Promise<string[] | null> {
  try {
    const res = await fetch(`${DATES_ENDPOINT}?from=${from}&to=${to}`)
    if (!res.ok) return null
    const body: { dates?: string[] } = await res.json()
    return body.dates ?? []
  } catch {
    return null
  }
}

/** The published dates loaded so far, growing as the calendar pages into unloaded months. */
function usePublishedDates(initialDates: string[], initialRange: { from: string; to: string }) {
  const [published, setPublished] = useState(() => new Set(initialDates))
  const { loading, loadMonth } = useMonthLoader(initialRange, fetchMonth, (fetched) =>
    setPublished((prev) => new Set([...prev, ...fetched])),
  )

  return { published, loading, loadMonth }
}

/** Today as the page rendered it, then the client's own clock: dated pages are cached for weeks. */
function useToday(renderedToday: string) {
  const [today, setToday] = useState(renderedToday)
  useEffect(() => setToday(dayKey(new Date())), [])
  return today
}

/** The month the calendar shows, loading its dates as the reader pages into it. */
function useCalendarMonth(date: string, loadMonth: (target: Date) => Promise<void>) {
  const [month, setMonth] = useState(() => startOfMonth(parseISO(date)))
  const showMonth = (next: Date) => {
    setMonth(next)
    void loadMonth(next)
  }
  return { month, showMonth }
}

const DayContext = createContext<{ published: Set<string>; date: string; today: string }>({
  published: new Set(),
  date: '',
  today: '',
})

function Day({ day, className }: ComponentProps<typeof DayButton>) {
  const { published, date, today } = useContext(DayContext)
  const key = dayKey(day.date)
  if (!published.has(key)) return <MutedDay date={day.date} className={className} />

  const chosen = key === date
  return (
    <Link
      href={dateHref(key, today)}
      prefetch={false}
      aria-label={day.date.toDateString()}
      aria-current={chosen ? 'date' : undefined}
      className={cn(DAY_CELL, 'hover:bg-accent', chosen && 'font-bold', className)}
      style={{ outline: chosen ? '2px solid #2563eb' : undefined, outlineOffset: '-2px' }}
    >
      {day.date.getDate()}
    </Link>
  )
}

/** The month grid, with a spinner over it while a month's dates load. */
function PublishedCalendar({
  month,
  onMonthChange,
  today,
  loading,
}: {
  month: Date
  onMonthChange: (next: Date) => void
  today: string
  loading: boolean
}) {
  return (
    <div className="relative">
      <Calendar
        mode="single"
        month={month}
        onMonthChange={onMonthChange}
        endMonth={parseISO(today)}
        components={{ DayButton: Day }}
      />
      {loading && (
        <div className="bg-background/60 absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}
    </div>
  )
}

export function DatePicker({
  date,
  today: renderedToday,
  initialDates,
  initialRange,
}: {
  /** The date shown, `YYYY-MM-DD`. */
  date: string
  /** Today when the page rendered; dated pages are cached for weeks, so the client re-reads it. */
  today: string
  /** Dates with a published forecast inside `initialRange`, oldest first. */
  initialDates: string[]
  /** The `from`/`to` window `initialDates` covers. */
  initialRange: { from: string; to: string }
}) {
  const { published, loading, loadMonth } = usePublishedDates(initialDates, initialRange)
  const today = useToday(renderedToday)
  const { month, showMonth } = useCalendarMonth(date, loadMonth)
  const loaded = useMemo(() => [...published], [published])
  const { olderHref, newerHref } = adjacentForecastHrefs(loaded, date, today, BASE)

  return (
    <DatePickerBar
      olderHref={olderHref}
      newerHref={newerHref}
      olderLabel="Older forecast"
      newerLabel="Newer forecast"
    >
      <DatePickerPopover label={triggerLabel(date)}>
        <DayContext.Provider value={{ published, date, today }}>
          <PublishedCalendar
            month={month}
            onMonthChange={showMonth}
            today={today}
            loading={loading}
          />
        </DayContext.Provider>
      </DatePickerPopover>
    </DatePickerBar>
  )
}
