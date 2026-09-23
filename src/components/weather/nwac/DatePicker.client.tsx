'use client'

/**
 * Steps between the dates with a published forecast, or picks one from a calendar that offers
 * only those. Today lives at `/weather/forecast`; any other date at `/weather/forecast/<date>`.
 */
import { format } from 'date-fns/format'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/utilities/ui'

const BASE = '/weather/forecast'
const SIDE = 'flex h-10 w-10 items-center justify-center hover:bg-accent'

export function dateHref(date: string, today: string) {
  return date === today ? BASE : `${BASE}/${date}`
}

const toDate = (ymd: string) => {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, m - 1, d)
}
const toYmd = (d: Date) => format(d, 'yyyy-MM-dd')

function Step({ to, today, label }: { to?: string; today: string; label: 'Previous' | 'Next' }) {
  const Icon = label === 'Previous' ? ChevronLeft : ChevronRight
  const aria = `${label} forecast`
  if (!to) {
    return (
      <span aria-disabled="true" aria-label={aria} className={cn(SIDE, 'text-muted-foreground/40')}>
        <Icon className="size-4" />
      </span>
    )
  }
  return (
    <Link href={dateHref(to, today)} aria-label={aria} className={SIDE}>
      <Icon className="size-4" />
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
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const published = new Set(dates)
  const prev = dates.filter((d) => d < date).at(-1)
  const next = dates.find((d) => d > date)

  const pick = (day: Date | undefined) => {
    if (!day) return
    setOpen(false)
    router.push(dateHref(toYmd(day), today))
  }

  return (
    <div className="inline-flex items-stretch divide-x rounded-md border print:hidden">
      <Step to={prev} today={today} label="Previous" />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger className="flex h-10 items-center gap-2 px-4 font-semibold hover:bg-accent">
          <CalendarDays aria-hidden="true" className="size-4" />
          {format(toDate(date), 'MMM d, yyyy')}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={toDate(date)}
            defaultMonth={toDate(date)}
            onSelect={pick}
            disabled={(day) => !published.has(toYmd(day))}
          />
        </PopoverContent>
      </Popover>
      <Step to={next} today={today} label="Next" />
    </div>
  )
}
