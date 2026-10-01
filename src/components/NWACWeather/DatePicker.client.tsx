'use client'

/**
 * Steps between the dates with a published Mountain Weather forecast, or picks one from a
 * calendar that offers only those. Looks like the avalanche forecast's picker, without the danger
 * colors. Today lives at `/weather/forecast`; any other date at `/weather/forecast/<date>`.
 */
import { parseISO, startOfMonth } from 'date-fns'
import Link from 'next/link'
import { createContext, useContext, useState, type ComponentProps } from 'react'
import type { DayButton } from 'react-day-picker'

import {
  DAY_CELL,
  DatePickerBar,
  DatePickerPopover,
  MutedDay,
} from '@/components/forecast/DatePickerParts.client'
import { dayKey, forecastHref, triggerLabel } from '@/components/forecast/datePickerNavigation'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/utilities/ui'

const BASE = '/weather/forecast'

export function dateHref(date: string, today: string) {
  return forecastHref(BASE, today, date)
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
  dates,
  today,
}: {
  /** The date shown, `YYYY-MM-DD`. */
  date: string
  /** Dates with a published forecast, oldest first. */
  dates: string[]
  today: string
}) {
  const [month, setMonth] = useState(() => startOfMonth(parseISO(date)))
  const prev = dates.filter((d) => d < date).at(-1)
  const next = dates.find((d) => d > date)

  return (
    <DatePickerBar
      olderHref={prev && dateHref(prev, today)}
      newerHref={next && dateHref(next, today)}
      olderLabel="Older forecast"
      newerLabel="Newer forecast"
    >
      <DatePickerPopover label={triggerLabel(date)}>
        <DayContext.Provider value={{ published: new Set(dates), date, today }}>
          <Calendar
            mode="single"
            month={month}
            onMonthChange={setMonth}
            startMonth={dates[0] ? parseISO(dates[0]) : undefined}
            endMonth={parseISO(today)}
            components={{ DayButton: Day }}
          />
        </DayContext.Provider>
      </DatePickerPopover>
    </DatePickerBar>
  )
}
