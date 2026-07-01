/**
 * Avalanche warning/watch banner with progressive enhancement.
 * Uses <details>/<summary> — no client JS needed.
 */
import { ProductType, type WarningProduct } from '@/services/nac/model/forecast'
import { formatDateTime } from '@/utilities/formatDateTime'
import { cn } from '@/utilities/ui'

import { sanitizeHtml } from './sanitizeHtml'

interface WarningBannerProps {
  warning: WarningProduct | null
  timezone: string | null | undefined
}

const DATE_FORMAT = "EEEE, MMMM d, yyyy 'at' h:mm a zzz"

function bannerStyles(productType: ProductType): { bg: string; border: string; text: string } {
  switch (productType) {
    case ProductType.Warning:
      return {
        bg: 'bg-red-50 dark:bg-red-950',
        border: 'border-red-300 dark:border-red-800',
        text: 'text-red-900 dark:text-red-100',
      }
    case ProductType.Watch:
      return {
        bg: 'bg-orange-50 dark:bg-orange-950',
        border: 'border-orange-300 dark:border-orange-800',
        text: 'text-orange-900 dark:text-orange-100',
      }
    case ProductType.Special:
      return {
        bg: 'bg-yellow-50 dark:bg-yellow-950',
        border: 'border-yellow-300 dark:border-yellow-800',
        text: 'text-yellow-900 dark:text-yellow-100',
      }
    default:
      return {
        bg: 'bg-red-50 dark:bg-red-950',
        border: 'border-red-300 dark:border-red-800',
        text: 'text-red-900 dark:text-red-100',
      }
  }
}

// Matches the legacy afp warnings widget ("Avalanche Warning in Effect", etc.).
function productLabel(productType: ProductType): string {
  switch (productType) {
    case ProductType.Warning:
      return 'Avalanche Warning in Effect'
    case ProductType.Watch:
      return 'Avalanche Watch in Effect'
    case ProductType.Special:
      return 'Special Avalanche Bulletin in Effect'
    default:
      return 'Avalanche Warning in Effect'
  }
}

export function WarningBanner({ warning, timezone }: WarningBannerProps) {
  if (!warning) return null

  const styles = bannerStyles(warning.product_type)
  const label = productLabel(warning.product_type)
  const issued = formatDateTime(warning.published_time, timezone, DATE_FORMAT)
  const expires = formatDateTime(warning.expires_time, timezone, DATE_FORMAT)

  return (
    <details className={cn('rounded-lg border', styles.bg, styles.border)}>
      <summary className={cn('cursor-pointer px-4 py-3 font-semibold', styles.text)}>
        ⚠ {label}: {warning.bottom_line}
      </summary>
      <div className={cn('space-y-2 px-4 pb-4 pt-2 text-sm', styles.text)}>
        <p>
          <span className="font-medium">Issued:</span> {issued}
        </p>
        <p>
          <span className="font-medium">Expires:</span> {expires}
        </p>
        {warning.affected_area && (
          <p>
            <span className="font-medium">Affected Area:</span> {warning.affected_area}
          </p>
        )}
        {warning.reason && (
          <p>
            <span className="font-medium">Reason:</span> {warning.reason}
          </p>
        )}
        {warning.hazard_discussion && (
          <div
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(warning.hazard_discussion) }}
          />
        )}
      </div>
    </details>
  )
}
