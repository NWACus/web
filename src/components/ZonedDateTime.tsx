'use client'

import { formatDateTime, splitDateTimeRange } from '@/utilities/formatDateTime'
import { timezonesAgreeAt } from '@/utilities/timezones'
import { useViewerTimezone } from '@/utilities/useViewerTimezone'
import { Fragment } from 'react'

// A bare calendar date like 2026-01-15, with no time of day.
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

const DEFAULT_DATE_TIME_FORMAT = 'MMM d, yyyy, p'
const DEFAULT_DATE_FORMAT = 'MMM d, yyyy'

type ZonedDateTimeProps = {
  /** An ISO instant, or a `YYYY-MM-DD` calendar date. */
  dateTime: string
  /** End of a range. Ranges use `splitDateTimeRange` and ignore `format`. */
  endDateTime?: string | null
  /** IANA timezone to display in, usually the avalanche center's. */
  timeZone: string
  /** date-fns pattern without a zone token; instants always get the zone abbreviation appended. */
  format?: string
  className?: string
}

/** A run of event text, with the viewer's local equivalent to follow it in parentheses. */
type Segment = { dateTime: string; text: string; viewerText: string | null }

const dayIn = (instant: string, timeZone: string) => formatDateTime(instant, timeZone, 'yyyy-MM-dd')

/** A clock time, with its date only when the viewer's day is not one the reader already assumes. */
function viewerFormat(instant: string, viewerTimeZone: string, assumedDays: string[]): string {
  return assumedDays.includes(dayIn(instant, viewerTimeZone)) ? 'p' : 'MMM d, p'
}

/** The viewer's timezone when it disagrees with the event's at any instant shown, otherwise null. */
function differingViewerZone(
  { dateTime, endDateTime, timeZone }: ZonedDateTimeProps,
  viewerTimeZone: string | null,
): string | null {
  if (!viewerTimeZone || DATE_ONLY.test(dateTime)) return null
  const instants = [dateTime, endDateTime].filter((value): value is string => !!value)
  const agrees = instants.every((value) =>
    timezonesAgreeAt(timeZone, viewerTimeZone, new Date(value)),
  )
  return agrees ? null : viewerTimeZone
}

function formatViewerInstant(instant: string, timeZone: string, viewerTimeZone: string | null) {
  if (!viewerTimeZone) return null
  const format = viewerFormat(instant, viewerTimeZone, [dayIn(instant, timeZone)])
  return formatDateTime(instant, viewerTimeZone, `${format} zzz`)
}

function formatViewerRange(
  start: string,
  end: string,
  timeZone: string,
  viewerTimeZone: string | null,
) {
  if (!viewerTimeZone) return null
  const startFormat = viewerFormat(start, viewerTimeZone, [dayIn(start, timeZone)])
  // An end on the event's day, or on the viewer's start day, reads correctly without a date.
  const endFormat = viewerFormat(end, viewerTimeZone, [
    dayIn(end, timeZone),
    dayIn(start, viewerTimeZone),
  ])
  return `${formatDateTime(start, viewerTimeZone, startFormat)} - ${formatDateTime(end, viewerTimeZone, `${endFormat} zzz`)}`
}

/**
 * A single instant or same-day range is one segment. A multi-day range is two, so each day's time
 * gets its own local equivalent beside it.
 */
function toSegments(value: ZonedDateTimeProps, viewerTimeZone: string | null): Segment[] {
  const { dateTime, endDateTime, timeZone, format } = value
  const viewer = differingViewerZone(value, viewerTimeZone)

  // A calendar date names the same day everywhere, so format it in UTC where it cannot shift.
  if (DATE_ONLY.test(dateTime)) {
    const text = formatDateTime(dateTime, 'UTC', format ?? DEFAULT_DATE_FORMAT)
    return [{ dateTime, text, viewerText: null }]
  }
  if (!endDateTime) {
    const text = formatDateTime(dateTime, timeZone, `${format ?? DEFAULT_DATE_TIME_FORMAT} zzz`)
    return [{ dateTime, text, viewerText: formatViewerInstant(dateTime, timeZone, viewer) }]
  }

  const range = splitDateTimeRange(dateTime, endDateTime, timeZone)
  if (range.sameDay) {
    const viewerText = formatViewerRange(dateTime, endDateTime, timeZone, viewer)
    return [{ dateTime, text: `${range.start} - ${range.end}`, viewerText }]
  }
  return [
    { dateTime, text: range.start, viewerText: formatViewerInstant(dateTime, timeZone, viewer) },
    {
      dateTime: endDateTime,
      text: range.end,
      viewerText: formatViewerInstant(endDateTime, timeZone, viewer),
    },
  ]
}

/**
 * A date or time shown in a fixed timezone, with the zone named. When the viewer's own timezone
 * disagrees, their local time follows in parentheses, e.g. `1:00 PM PDT (2:00 PM MDT)`. That only
 * appears after hydration, so server and client markup always match; it fades in unless the
 * viewer prefers reduced motion.
 */
export function ZonedDateTime({ className, ...value }: ZonedDateTimeProps) {
  const viewerTimeZone = useViewerTimezone()

  return (
    <span className={className}>
      {toSegments(value, viewerTimeZone).map(({ dateTime, text, viewerText }, index) => (
        <Fragment key={index}>
          {index > 0 && ' - '}
          <time dateTime={dateTime}>{text}</time>
          {viewerText && (
            <>
              {' '}
              {/* Wraps as one unit rather than splitting a time from its AM/PM. */}
              <span className="whitespace-nowrap motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
                (<span className="sr-only">your time: </span>
                {viewerText})
              </span>
            </>
          )}
        </Fragment>
      ))}
    </span>
  )
}
