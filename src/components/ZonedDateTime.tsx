'use client'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatDateTime, formatDateTimeRange } from '@/utilities/formatDateTime'
import { timezonesAgreeAt } from '@/utilities/timezones'
import { cn } from '@/utilities/ui'
import { useViewerTimezone } from '@/utilities/useViewerTimezone'

// A bare calendar date like 2026-01-15, with no time of day.
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

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
    <Popover>
      {/* Stop clicks reaching clickable ancestors, like an expandable table row. */}
      <PopoverTrigger
        className={cn(
          'inline rounded-sm text-left underline decoration-dotted underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className,
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <time dateTime={value.dateTime}>{text}</time>
        <span className="sr-only"> ({viewerText} your time)</span>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto p-2 text-sm"
        onClick={(event) => event.stopPropagation()}
      >
        <p>{viewerText}</p>
        <p className="text-xs text-muted-foreground">Your local time</p>
      </PopoverContent>
    </Popover>
  )
}
