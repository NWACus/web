/**
 * Forecast metadata: published time, expiration time, and author name.
 */
import { Card, CardContent } from '@/components/ui/card'
import type { Forecast, Summary } from '@/services/nac/types/forecastSchemas'

interface ForecastHeaderProps {
  forecast: Pick<Forecast | Summary, 'published_time' | 'expires_time' | 'author'>
}

function formatDateTime(iso: string | null): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

export function ForecastHeader({ forecast }: ForecastHeaderProps) {
  const published = formatDateTime(forecast.published_time)
  const expires = formatDateTime(forecast.expires_time)

  return (
    <Card>
      <CardContent className="space-y-1 pt-6 text-sm text-muted-foreground">
        {forecast.author && (
          <p>
            <span className="font-medium text-foreground">Author:</span> {forecast.author}
          </p>
        )}
        {published && (
          <p>
            <span className="font-medium text-foreground">Published:</span> {published}
          </p>
        )}
        {expires && (
          <p>
            <span className="font-medium text-foreground">Expires:</span> {expires}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
