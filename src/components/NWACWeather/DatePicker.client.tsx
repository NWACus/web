'use client'

/**
 * Steps between the dates with a published Mountain Weather forecast, or picks one from a
 * calendar that offers only those. Looks like the avalanche forecast's picker, without the danger
 * colors, and loads months the same way: the server seeds an initial window, and the calendar
 * fetches further months from `/api/nwac/nwac-weather-dates` as the reader pages into them, so a
 * dated page never ships the whole list. Today lives at `/weather/forecast`; any other date at
 * `/weather/forecast/<date>`.
 */
import { endOfMonth, format, parseISO, startOfMonth } from 'date-fns'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { createContext, useContext, useMemo, useState, type ComponentProps } from 'react'
import type { DayButton } from 'react-day-picker'

import {
  DAY_CELL,
  DatePickerBar,
  DatePickerPopover,
  MutedDay,
} from '@/components/forecast/DatePickerParts.client'
import {
  adjacentForecastHrefs,
  dayKey,
  forecastHref,
  monthKey,
  monthsBetween,
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
  const [loadedMonths, setLoadedMonths] = useState(
    () => new Set(monthsBetween(initialRange.from, initialRange.to)),
  )
  const [loading, setLoading] = useState(false)

  const loadMonth = async (target: Date) => {
    const month = monthKey(target)
    if (loadedMonths.has(month)) return

    setLoading(true)
    const fetched = await fetchMonth(
      format(startOfMonth(target), 'yyyy-MM-dd'),
      format(endOfMonth(target), 'yyyy-MM-dd'),
    )
    if (fetched) {
      setPublished((prev) => new Set([...prev, ...fetched]))
      setLoadedMonths((prev) => new Set(prev).add(month))
    }
    setLoading(false)
  }

  return { published, loading, loadMonth }
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

export function DatePicker({
  date,
  today,
  initialDates,
  initialRange,
}: {
  /** The date shown, `YYYY-MM-DD`. */
  date: string
  today: string
  /** Dates with a published forecast inside `initialRange`, oldest first. */
  initialDates: string[]
  /** The `from`/`to` window `initialDates` covers. */
  initialRange: { from: string; to: string }
}) {
  const { published, loading, loadMonth } = usePublishedDates(initialDates, initialRange)
  const [month, setMonth] = useState(() => startOfMonth(parseISO(date)))
  const loaded = useMemo(() => [...published], [published])
  const { olderHref, newerHref } = adjacentForecastHrefs(loaded, date, today, BASE)

  const handleMonthChange = (next: Date) => {
    setMonth(next)
    void loadMonth(next)
  }

  return (
    <DatePickerBar
      olderHref={olderHref}
      newerHref={newerHref}
      olderLabel="Older forecast"
      newerLabel="Newer forecast"
    >
      <DatePickerPopover label={triggerLabel(date)}>
        <div className="relative">
          <DayContext.Provider value={{ published, date, today }}>
            <Calendar
              mode="single"
              month={month}
              onMonthChange={handleMonthChange}
              endMonth={parseISO(today)}
              components={{ DayButton: Day }}
            />
          </DayContext.Provider>
          {loading && (
            <div className="bg-background/60 absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}
        </div>
      </DatePickerPopover>
    </DatePickerBar>
  )
}
