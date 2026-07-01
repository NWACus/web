/**
 * Validity-date banner. On a dated/history view it marks the forecast as an archived product and
 * links back to the current one; on the live view it warns when the forecast has expired. The
 * wording matches the legacy afp ForecastBanner word-for-word ("This is an archived product." /
 * "This product is expired.").
 *
 * afp also offers an "all archived forecasts" link; native has no all-archives page yet (the date
 * picker on this page covers per-zone history), so that clause is omitted. "Withdrawn" has no
 * representation in the v2 model, so it is not surfaced. Expiry is an absolute-instant comparison.
 */
import { History, TriangleAlert } from 'lucide-react'
import Link from 'next/link'

import type { ForecastResult } from '@/services/nac/model/forecast'

interface ValidityBannerProps {
  forecast: Pick<ForecastResult, 'expires_time'>
  /** The shown date (`YYYY-MM-DD`), or null when showing the current/live forecast. */
  selectedDate: string | null
  /** Tenant-relative path to this zone's live forecast, for the "most recent forecast" link. */
  basePath: string
}

export function ValidityBanner({ forecast, selectedDate, basePath }: ValidityBannerProps) {
  // Archived: a dated/history view is, by definition, not the current product.
  if (selectedDate != null) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100">
        <History className="h-5 w-5 shrink-0" aria-hidden="true" />
        <span>
          This is an archived product. View the{' '}
          <Link
            href={basePath}
            className="font-medium underline underline-offset-2 hover:no-underline"
          >
            most recent forecast
          </Link>
          .
        </span>
      </div>
    )
  }

  // Live view: the current product's validity window has passed.
  const expired =
    forecast.expires_time != null && Date.now() > new Date(forecast.expires_time).getTime()
  if (expired) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
        <TriangleAlert className="h-5 w-5 shrink-0" aria-hidden="true" />
        <span>This product is expired.</span>
      </div>
    )
  }

  return null
}
