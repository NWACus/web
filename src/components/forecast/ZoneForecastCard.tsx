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
import { DangerLevel, ForecastPeriod, ProductType } from '@/services/nac/model/forecast'
import type { ElevationBandNames } from '@/services/nac/types/schemas'

import { BottomLine } from './BottomLine'
import { DangerRating } from './DangerRating'
import { ForecastErrorBoundary } from './ForecastErrorBoundary'
import { ForecastHeader } from './ForecastHeader'
import { WarningBanner } from './WarningBanner'

interface ZoneForecastCardProps {
  zoneName: string
  zoneSlug: string
  forecast: ForecastResult | null
  warning: WarningProduct | null
  elevationBandNames: ElevationBandNames
  timezone: string | null | undefined
}

/** All danger levels ordered for safe index lookup. */
const dangerLevels: DangerLevel[] = [
  DangerLevel.None,
  DangerLevel.Low,
  DangerLevel.Moderate,
  DangerLevel.Considerable,
  DangerLevel.High,
  DangerLevel.Extreme,
]

function highestDangerLevel(danger: {
  upper: DangerLevel
  middle: DangerLevel
  lower: DangerLevel
}): DangerLevel {
  const max = Math.max(danger.upper, danger.middle, danger.lower)
  return dangerLevels[max] ?? DangerLevel.None
}

export function ZoneForecastCard({
  zoneName,
  zoneSlug,
  forecast,
  warning,
  elevationBandNames,
  timezone,
}: ZoneForecastCardProps) {
  const warningProduct = warning
  const isForecast = forecast?.product_type === ProductType.Forecast

  return (
    <Card className="relative transition-colors hover:border-primary focus-within:border-primary">
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
        {!forecast && <p className="text-sm text-muted-foreground">Forecast data unavailable.</p>}

        {forecast && (
          <>
            {warningProduct && (
              <div className="relative z-10">
                <ForecastErrorBoundary fallbackMessage="Unable to display warning">
                  <WarningBanner warning={warningProduct} />
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
                <BottomLine
                  html={forecast.bottom_line}
                  dangerLevel={
                    isForecast
                      ? highestDangerLevel(
                          forecast.danger.find((d) => d.valid_day === ForecastPeriod.Current) ?? {
                            upper: DangerLevel.None,
                            middle: DangerLevel.None,
                            lower: DangerLevel.None,
                          },
                        )
                      : DangerLevel.None
                  }
                />
              </ForecastErrorBoundary>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
