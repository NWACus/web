/**
 * Compact forecast card for one zone in the all-zones grid.
 *
 * The whole card is a single click target: a stretched link over the title
 * (`after:absolute after:inset-0`) covers the card and navigates to the zone's
 * forecast page. Interactive children (the warning banner's <details>) are
 * raised above the overlay with z-10 so they stay usable.
 */
import Link from 'next/link'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ForecastResult, WarningProduct } from '@/services/nac/model/forecast'
import { ProductType } from '@/services/nac/model/forecast'
import type { ElevationBandNames } from '@/services/nac/types/schemas'

import { BottomLine } from './BottomLine'
import { DangerRating } from './DangerRating'
import { ForecastErrorBoundary } from './ForecastErrorBoundary'
import { ForecastHeader } from './ForecastHeader'
import { WarningBanner } from './WarningBanner'
import { bottomLineDangerLevel } from './zoneCardDanger'

interface ZoneForecastCardProps {
  zoneName: string
  zoneSlug: string
  forecast: ForecastResult | null
  warning: WarningProduct | null
  elevationBandNames: ElevationBandNames
  timezone: string | null | undefined
}

export function ZoneForecastCard({
  zoneName,
  zoneSlug,
  forecast,
  warning,
  elevationBandNames,
  timezone,
}: ZoneForecastCardProps) {
  return (
    <Card
      // Every visible string in a card ("The Bottom Line", "Today", "Issued:") repeats once per
      // zone, so the grid's E2E coverage has no other way to scope an assertion to one card.
      data-testid={`zone-card-${zoneSlug}`}
      className="relative transition-colors hover:border-primary focus-within:border-primary"
    >
      <CardHeader>
        <CardTitle>
          <Link
            href={`/forecasts/avalanche/${zoneSlug}`}
            className="after:absolute after:inset-0 hover:underline focus-visible:underline focus-visible:outline-none"
          >
            {zoneName}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {forecast ? (
          <ZoneForecastCardBody
            forecast={forecast}
            warning={warning}
            elevationBandNames={elevationBandNames}
            timezone={timezone}
          />
        ) : (
          <p className="text-sm text-muted-foreground">Forecast data unavailable.</p>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Each section is independently boundaried so one malformed field degrades that section only,
 * rather than blanking the whole card.
 */
function ZoneForecastCardBody({
  forecast,
  warning,
  elevationBandNames,
  timezone,
}: {
  forecast: ForecastResult
  warning: WarningProduct | null
  elevationBandNames: ElevationBandNames
  timezone: string | null | undefined
}) {
  const isForecast = forecast.product_type === ProductType.Forecast

  return (
    <>
      {warning && (
        <div className="relative z-10">
          <ForecastErrorBoundary fallbackMessage="Unable to display warning">
            <WarningBanner warning={warning} timezone={timezone} />
          </ForecastErrorBoundary>
        </div>
      )}

      <ForecastErrorBoundary fallbackMessage="Unable to display forecast metadata">
        <ForecastHeader forecast={forecast} timezone={timezone} />
      </ForecastErrorBoundary>

      {isForecast && (
        <ForecastErrorBoundary fallbackMessage="Unable to display danger rating">
          <DangerRating danger={forecast.danger} elevationBandNames={elevationBandNames} />
        </ForecastErrorBoundary>
      )}

      {forecast.bottom_line && (
        <ForecastErrorBoundary fallbackMessage="Unable to display the bottom line">
          <BottomLine html={forecast.bottom_line} dangerLevel={bottomLineDangerLevel(forecast)} />
        </ForecastErrorBoundary>
      )}
    </>
  )
}
