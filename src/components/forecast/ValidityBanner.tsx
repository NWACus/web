/**
 * Validity-date banner. On a dated/history view it marks the forecast as an archived product and
 * links back to the current one; on the live view it warns when the forecast has expired. The
 * wording matches the legacy afp ForecastBanner word-for-word ("This is an archived product." /
 * "This product is expired.").
 *
 * The archived notice also links to the center's archive browser, as afp's does. "Withdrawn" has
 * no representation in the v2 model, so it is not surfaced.
 *
 * The archived notice is settled at render time, but expiry is not: it turns over on the clock
 * alone, so it is delegated to `ProductExpiry`, which decides the server's answer and hands it to
 * `ExpiryNotice` to keep honest.
 */
import { History } from 'lucide-react'
import Link from 'next/link'

import { ARCHIVE_PATH } from '@/services/nac/forecastArchive'
import type { ForecastResult } from '@/services/nac/model/forecast'

import { ProductExpiry } from './ProductExpiry'

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
          </Link>{' '}
          or{' '}
          <Link
            href={ARCHIVE_PATH}
            className="font-medium underline underline-offset-2 hover:no-underline"
          >
            all archived forecasts
          </Link>
          .
        </span>
      </div>
    )
  }

  // Live view: has the current product's validity window passed? Decided on the server and then
  // kept honest client-side, since it turns over on the clock alone.
  return <ProductExpiry forecast={forecast} />
}
