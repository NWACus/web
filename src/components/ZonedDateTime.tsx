'use client'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatDateTime, formatDateTimeRange } from '@/utilities/formatDateTime'
import { timezonesAgreeAt } from '@/utilities/timezones'
import { cn } from '@/utilities/ui'
import { useViewerTimezone } from '@/utilities/useViewerTimezone'
import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'

// A bare calendar date like 2026-01-15, with no time of day.
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

// Long enough for the pointer to cross the gap to the popover without it flickering shut.
const HOVER_CLOSE_DELAY_MS = 150

const DEFAULT_DATE_TIME_FORMAT = 'MMM d, yyyy, p'
const DEFAULT_DATE_FORMAT = 'MMM d, yyyy'
// Always includes the date, since the viewer's clock can be on a different day than the center's.
const VIEWER_FORMAT = 'EEE, MMM d, h:mm a zzz'

type ZonedDateTimeProps = {
  /** An ISO instant, or a `YYYY-MM-DD` calendar date. */
  dateTime: string
  /** End of a range. Ranges use `formatDateTimeRange` and ignore `format`. */
  endDateTime?: string | null
  /** IANA timezone to display in, usually the avalanche center's. */
  timeZone: string
  /** date-fns pattern without a zone token; instants always get the zone abbreviation appended. */
  format?: string
  /** Turn off inside links and clickable cards, where a nested button would be invalid. */
  viewerTimeHint?: boolean
  className?: string
}

function formatInZone({
  dateTime,
  endDateTime,
  timeZone,
  format,
}: Pick<ZonedDateTimeProps, 'dateTime' | 'endDateTime' | 'timeZone' | 'format'>): string {
  // A calendar date names the same day everywhere, so format it in UTC where it cannot shift.
  if (DATE_ONLY.test(dateTime))
    return formatDateTime(dateTime, 'UTC', format ?? DEFAULT_DATE_FORMAT)
  if (endDateTime) return formatDateTimeRange(dateTime, endDateTime, timeZone)
  return formatDateTime(dateTime, timeZone, `${format ?? DEFAULT_DATE_TIME_FORMAT} zzz`)
}

/** The same moment on the viewer's clock, or null when there is nothing to add. */
function formatForViewer(
  {
    dateTime,
    endDateTime,
    timeZone,
  }: Pick<ZonedDateTimeProps, 'dateTime' | 'endDateTime' | 'timeZone'>,
  viewerTimeZone: string | null,
): string | null {
  if (!viewerTimeZone || DATE_ONLY.test(dateTime)) return null
  const instants = [dateTime, endDateTime].filter((value): value is string => !!value)
  const agrees = instants.every((value) =>
    timezonesAgreeAt(timeZone, viewerTimeZone, new Date(value)),
  )
  if (agrees) return null
  return endDateTime
    ? formatDateTimeRange(dateTime, endDateTime, viewerTimeZone)
    : formatDateTime(dateTime, viewerTimeZone, VIEWER_FORMAT)
}

/**
 * The time, underlined, with the viewer's local equivalent in a popover. A mouse opens it on
 * hover, since that is the cheaper gesture on a desktop; touch and keyboard open it on tap or
 * Enter, because neither can hover. Branching on `pointerType` rather than a breakpoint keeps
 * both gestures working on a touchscreen laptop.
 */
function ViewerTimeHint({
  dateTime,
  text,
  viewerText,
  className,
}: {
  dateTime: string
  text: string
  viewerText: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const openedByHover = useRef(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const cancelScheduledClose = useCallback(() => clearTimeout(closeTimer.current), [])
  useEffect(() => cancelScheduledClose, [cancelScheduledClose])

  const setOpenState = (next: boolean) => {
    if (!next) openedByHover.current = false
    setOpen(next)
  }

  const openOnHover = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return
    cancelScheduledClose()
    openedByHover.current = true
    setOpen(true)
  }

  const closeAfterHover = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return
    cancelScheduledClose()
    closeTimer.current = setTimeout(() => setOpenState(false), HOVER_CLOSE_DELAY_MS)
  }

  return (
    <Popover open={open} onOpenChange={setOpenState}>
      {/* Stop clicks reaching clickable ancestors, like an expandable table row. */}
      <PopoverTrigger
        className={cn(
          'inline rounded-sm text-left underline decoration-dotted underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className,
        )}
        onPointerEnter={openOnHover}
        onPointerLeave={closeAfterHover}
        onClick={(event) => {
          event.stopPropagation()
          // Hover already opened it, so a click should leave it alone rather than toggle it shut.
          if (openedByHover.current) event.preventDefault()
        }}
      >
        <time dateTime={dateTime}>{text}</time>
        <span className="sr-only"> ({viewerText} your time)</span>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto p-2 text-sm"
        // Hovering must not pull focus out of the page; tap and keyboard still focus it as usual.
        onOpenAutoFocus={(event) => {
          if (openedByHover.current) event.preventDefault()
        }}
        onPointerEnter={cancelScheduledClose}
        onPointerLeave={closeAfterHover}
        onClick={(event) => event.stopPropagation()}
      >
        <p>{viewerText}</p>
        <p className="text-xs text-muted-foreground">Your local time</p>
      </PopoverContent>
    </Popover>
  )
}

/**
 * A date or time shown in a fixed timezone, with the zone named. When the viewer's own timezone
 * disagrees, the text becomes a popover trigger revealing the viewer's local equivalent. That
 * hint only appears after hydration, so server and client markup always match.
 */
export function ZonedDateTime({ viewerTimeHint = true, className, ...value }: ZonedDateTimeProps) {
  const viewerTimeZone = useViewerTimezone()
  const text = formatInZone(value)
  const viewerText = viewerTimeHint ? formatForViewer(value, viewerTimeZone) : null

  if (!viewerText) {
    return (
      <time dateTime={value.dateTime} className={className}>
        {text}
      </time>
    )
  }

  return (
    <ViewerTimeHint
      dateTime={value.dateTime}
      text={text}
      viewerText={viewerText}
      className={className}
    />
  )
}
