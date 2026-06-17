/**
 * Forecast metadata: issued time, expiration time, and author name.
 *
 * Rendered as a plain block (no Card) so it composes inside the all-zones zone
 * card without nesting a card in a card. Times are formatted in the avalanche
 * center's timezone (from the NAC metadata) because the page is server-rendered
 * and has no client locale to fall back on.
 */
import type { Forecast, Summary } from '@/services/nac/types/forecastSchemas'
import { formatDateTime } from '@/utilities/formatDateTime'

interface ForecastHeaderProps {
  forecast: Pick<Forecast | Summary, 'published_time' | 'expires_time' | 'author'>
  timezone: string | null | undefined
}

const DATE_FORMAT = "EEEE, MMMM d, yyyy 'at' h:mm a zzz"

function formatInZone(iso: string | null, timezone: string | null | undefined): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (isNaN(date.getTime())) return null
  return formatDateTime(iso, timezone, DATE_FORMAT)
}

export function ForecastHeader({ forecast, timezone }: ForecastHeaderProps) {
  const issued = formatInZone(forecast.published_time, timezone)
  const expires = formatInZone(forecast.expires_time, timezone)

  return (
    <div className="space-y-1 text-sm text-muted-foreground">
      {forecast.author && (
        <p>
          <span className="font-medium text-foreground">Author:</span> {forecast.author}
        </p>
      )}
      {issued && (
        <p>
          <span className="font-medium text-foreground">Issued:</span> {issued}
        </p>
      )}
      {expires && (
        <p>
          <span className="font-medium text-foreground">Expires:</span> {expires}
        </p>
      )}
    </div>
  )
}
