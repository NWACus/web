'use client'

/**
 * The look shared by the forecast and Mountain Weather date pickers: arrows either side of a
 * calendar trigger, the muted cell for a day with nothing published, and the month-by-month
 * loading both calendars do.
 */
import { endOfMonth, format, startOfMonth } from 'date-fns'
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/utilities/ui'

import { monthKey, monthsBetween } from './datePickerNavigation'

export const DAY_CELL =
  'flex aspect-square h-full w-full min-w-[--cell-size] items-center justify-center rounded-md text-sm'

/** A calendar day with no product: muted and non-interactive. */
export function MutedDay({ date, className }: { date: Date; className?: string }) {
  return (
    <span className={cn(DAY_CELL, 'text-muted-foreground opacity-40', className)}>
      {date.getDate()}
    </span>
  )
}

/**
 * A message that clears itself after `durationMs`, for the picker's brief notices. A new message
 * restarts the clock, and the timer is cleared on unmount.
 */
export function useFlashMessage(durationMs: number): [string, (message: string) => void] {
  const [message, setMessage] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  const flash = useCallback(
    (next: string) => {
      if (timer.current) clearTimeout(timer.current)
      setMessage(next)
      timer.current = setTimeout(() => setMessage(''), durationMs)
    },
    [durationMs],
  )

  return [message, flash]
}

/**
 * The months a picker has loaded, and loading one more as its calendar pages into it. The page
 * seeds `initialRange`; `fetchMonth` answers null on failure, which leaves the month unloaded so
 * the next visit to it retries. `onLoaded` folds a fetched month into the picker's own state.
 */
export function useMonthLoader<T>(
  initialRange: { from: string; to: string },
  fetchMonth: (from: string, to: string) => Promise<T | null>,
  onLoaded: (fetched: T) => void,
) {
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
      onLoaded(fetched)
      setLoadedMonths((prev) => new Set(prev).add(month))
    }
    setLoading(false)
  }

  return { loadedMonths, loading, loadMonth }
}

/** Older and newer arrows around the calendar trigger. */
export function DatePickerBar({
  olderHref,
  newerHref,
  olderLabel,
  newerLabel,
  children,
}: {
  olderHref: string | undefined
  newerHref: string | undefined
  olderLabel: string
  newerLabel: string
  children: ReactNode
}) {
  return (
    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
      <div className="inline-flex w-full items-stretch sm:w-auto">
        <ArrowLink href={olderHref} label={olderLabel} side="left" />
        {children}
        <ArrowLink href={newerHref} label={newerLabel} side="right" />
      </div>
    </div>
  )
}

/** The trigger button and the popover it opens. `tooltip` is the button's hover hint. */
export function DatePickerPopover({
  label,
  tooltip,
  children,
}: {
  label: string
  tooltip?: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          title={tooltip}
          className="flex-1 justify-center gap-2 rounded-none sm:w-56 sm:flex-none"
        >
          <CalendarIcon className="h-4 w-4" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="center">
        {children}
      </PopoverContent>
    </Popover>
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
