/**
 * Compact forecast card for one zone in the all-zones grid.
 */
import Link from 'next/link'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ForecastResult, WarningResult } from '@/services/nac/types/forecastSchemas'
import { DangerLevel, ForecastPeriod, ProductType } from '@/services/nac/types/forecastSchemas'
import type { ElevationBandNames } from '@/services/nac/types/schemas'

import { BottomLine } from './BottomLine'
import { DangerRating } from './DangerRating'
import { ForecastErrorBoundary } from './ForecastErrorBoundary'
import { ForecastHeader } from './ForecastHeader'
import { WarningBanner } from './WarningBanner'

interface ZoneForecastCardProps {
  zoneName: string
  zoneSlug: string
  centerSlug: string
  forecast: ForecastResult | null
  warning: WarningResult | null
  elevationBandNames: ElevationBandNames
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

/** Narrow a WarningResult to a Warning/Watch/Special or null. */
function toWarningProduct(result: WarningResult | null) {
  if (!result) return null
  if (result.avalanche_center === null) return null
  return result
}

export function ZoneForecastCard({
  zoneName,
  zoneSlug,
  centerSlug,
  forecast,
  warning,
  elevationBandNames,
}: ZoneForecastCardProps) {
  const warningProduct = toWarningProduct(warning)
  const isForecast = forecast?.product_type === ProductType.Forecast

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Link href={`/${centerSlug}/forecasts/avalanche/${zoneSlug}`} className="hover:underline">
            {zoneName}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!forecast && <p className="text-sm text-muted-foreground">Forecast data unavailable.</p>}

        {forecast && (
          <>
            <ForecastErrorBoundary fallbackMessage="Unable to display warning">
              <WarningBanner warning={warningProduct} />
            </ForecastErrorBoundary>

            <ForecastErrorBoundary fallbackMessage="Unable to display forecast metadata">
              <ForecastHeader forecast={forecast} />
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
