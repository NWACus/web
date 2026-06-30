/**
 * Validity-date banner. On a dated/history view it marks the forecast as archived; on the live
 * view it warns when the forecast has expired (the current moment is past `expires_time`).
 *
 * Expiry is an absolute-instant comparison, so it is timezone-independent; the archived heading
 * uses the center-timezone noon valid-date rule for the displayed date. "Withdrawn" has no
 * representation in the v2 model yet (ProductStatus is Published-only), so it is not surfaced.
 */
import { validDateHeading } from '@/services/nac/archiveDates'
import type { ForecastResult } from '@/services/nac/model/forecast'
import { formatDateTime } from '@/utilities/formatDateTime'
import { cn } from '@/utilities/ui'

interface ValidityBannerProps {
  forecast: Pick<ForecastResult, 'published_time' | 'expires_time'>
  timezone: string | null | undefined
  /** The shown date (`YYYY-MM-DD`), or null when showing the current/live forecast. */
  selectedDate: string | null
}

const EXPIRES_FORMAT = "EEEE, MMMM d, yyyy 'at' h:mm a zzz"

export function ValidityBanner({ forecast, timezone, selectedDate }: ValidityBannerProps) {
  // Archived: an explicitly dated/history view is, by definition, not the current product.
  if (selectedDate != null) {
    const validDate = validDateHeading(forecast.published_time, timezone, 0)
    return (
      <div className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100">
        You&rsquo;re viewing an archived forecast{validDate ? ` from ${validDate}` : ''}. It may no
        longer reflect current conditions.
      </div>
    )
  }

  // Live view: warn when the forecast has expired.
  const expired =
    forecast.expires_time != null && Date.now() > new Date(forecast.expires_time).getTime()
  if (expired && forecast.expires_time) {
    const expiredAt = formatDateTime(forecast.expires_time, timezone, EXPIRES_FORMAT)
    return (
      <div
        className={cn(
          'rounded-lg border px-4 py-3 text-sm',
          'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100',
        )}
      >
        This forecast expired on {expiredAt}. A newer forecast may be available.
      </div>
    )
  }

  return null
}
