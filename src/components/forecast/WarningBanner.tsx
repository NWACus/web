/**
 * Avalanche warning/watch banner with progressive enhancement.
 * Uses <details>/<summary> — no client JS needed.
 */
import { cn } from '@/utilities/ui'
import type { Warning, Watch, Special } from '@/services/nac/types/forecastSchemas'
import { ProductType } from '@/services/nac/types/forecastSchemas'

import { sanitizeHtml } from './sanitizeHtml'

type WarningProduct = Warning | Watch | Special

interface WarningBannerProps {
  warning: WarningProduct | null
}

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

function productLabel(productType: ProductType): string {
  switch (productType) {
    case ProductType.Warning:
      return 'Avalanche Warning'
    case ProductType.Watch:
      return 'Avalanche Watch'
    case ProductType.Special:
      return 'Special Bulletin'
    default:
      return 'Avalanche Alert'
  }
}

export function WarningBanner({ warning }: WarningBannerProps) {
  if (!warning) return null

  const styles = bannerStyles(warning.product_type)
  const label = productLabel(warning.product_type)

  return (
    <details
      className={cn('rounded-lg border', styles.bg, styles.border)}
    >
      <summary
        className={cn(
          'cursor-pointer px-4 py-3 font-semibold',
          styles.text,
        )}
      >
        ⚠ {label}: {warning.bottom_line}
      </summary>
      <div className={cn('space-y-2 px-4 pb-4 pt-2 text-sm', styles.text)}>
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
