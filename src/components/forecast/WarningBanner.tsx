/**
 * Per-zone avalanche warning/watch/special banner on the forecast page.
 *
 * Rendered as a solid alert bar rather than a tinted note: on a safety-critical page a warning
 * has to read as an alarm at a glance, and this is the surface a reader lands on from a push
 * notification or a shared link. Shares its color and heading with the center-level home-page
 * banner via `warningPresentation` so the two cannot diverge.
 *
 * Uses <details>/<summary>, so the full hazard discussion expands in place with no client JS —
 * an improvement on the legacy widget's "Read more", which navigates away from the forecast.
 */
import { AlertTriangle, ChevronDown } from 'lucide-react'

import { warningBannerColor, warningBannerHeading } from '@/components/warnings/warningPresentation'
import type { WarningProduct } from '@/services/nac/model/forecast'
import { formatDateTime } from '@/utilities/formatDateTime'

import { sanitizeHtml } from './sanitizeHtml'

interface WarningBannerProps {
  warning: WarningProduct | null
  timezone: string | null | undefined
}

const DATE_FORMAT = "EEEE, MMMM d, yyyy 'at' h:mm a zzz"

/** The always-visible alarm: what it is, what to do, and how long it holds. */
function AlertBar({
  warning,
  timezone,
}: {
  warning: WarningProduct
  timezone: string | null | undefined
}) {
  return (
    <>
      <AlertTriangle
        className="h-9 w-9 shrink-0 sm:h-12 sm:w-12 printWide:h-12 printWide:w-12"
        strokeWidth={1.5}
        aria-hidden="true"
      />
      <div className="grow space-y-1.5">
        <h2 className="text-base font-bold uppercase tracking-wide sm:text-lg printWide:text-lg">
          {warningBannerHeading(warning.product_type)}
        </h2>
        {warning.bottom_line && <p className="text-sm leading-snug">{warning.bottom_line}</p>}
        <div className="flex flex-col gap-x-6 gap-y-0.5 border-l-2 border-white/60 pl-2 text-xs sm:flex-row printWide:flex-row">
          <span>
            <span className="font-semibold uppercase">Issued</span>{' '}
            {formatDateTime(warning.published_time, timezone, DATE_FORMAT)}
          </span>
          <span>
            <span className="font-semibold uppercase">Expires</span>{' '}
            {formatDateTime(warning.expires_time, timezone, DATE_FORMAT)}
          </span>
        </div>
      </div>
    </>
  )
}

/**
 * The expanded long-form content, on a neutral surface — the solid fill is for the alarm, not
 * for reading a paragraph of hazard discussion against.
 */
function AlertDetail({ warning, color }: { warning: WarningProduct; color: string }) {
  return (
    <div
      className="space-y-2 rounded-b-lg border-2 border-t-0 bg-background px-4 pb-4 pt-3 text-sm"
      style={{ borderColor: color }}
    >
      {warning.affected_area && (
        <p>
          <span className="font-semibold">Affected Area:</span> {warning.affected_area}
        </p>
      )}
      {warning.reason && (
        <p>
          <span className="font-semibold">Reason:</span> {warning.reason}
        </p>
      )}
      {warning.hazard_discussion && (
        <div
          className="prose prose-sm max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(warning.hazard_discussion) }}
        />
      )}
    </div>
  )
}

export function WarningBanner({ warning, timezone }: WarningBannerProps) {
  if (!warning) return null

  const color = warningBannerColor(warning.product_type)
  const hasDetail = Boolean(warning.affected_area || warning.reason || warning.hazard_discussion)

  // Nothing to expand into: render the same bar as a plain, non-interactive alert.
  if (!hasDetail) {
    return (
      <div
        role="alert"
        className="flex items-start gap-3 rounded-lg px-4 py-3 text-white"
        style={{ backgroundColor: color }}
      >
        <AlertBar warning={warning} timezone={timezone} />
      </div>
    )
  }

  return (
    <details role="alert" className="group rounded-lg">
      <summary
        className="flex cursor-pointer list-none items-start gap-3 rounded-lg px-4 py-3 text-white group-open:rounded-b-none [&::-webkit-details-marker]:hidden"
        style={{ backgroundColor: color }}
      >
        <AlertBar warning={warning} timezone={timezone} />
        <span className="flex shrink-0 items-center gap-1 rounded bg-white/25 px-3 py-1.5 text-sm font-medium hover:bg-white/35">
          Read more
          <ChevronDown
            className="h-4 w-4 transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </span>
      </summary>
      <AlertDetail warning={warning} color={color} />
    </details>
  )
}
