/**
 * Danger rating section: DangerTriangle + 3 DangerElevationBand rows for today,
 * plus a tomorrow outlook section.
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type AvalancheDangerForecast, ForecastPeriod } from '@/services/nac/types/forecastSchemas'
import type { ElevationBandNames } from '@/services/nac/types/schemas'

import { DangerElevationBand } from './DangerElevationBand'
import { DangerTriangle } from './DangerTriangle'

interface DangerRatingProps {
  danger: AvalancheDangerForecast[]
  elevationBandNames: ElevationBandNames
}

export function DangerRating({ danger, elevationBandNames }: DangerRatingProps) {
  const today = danger.find((d) => d.valid_day === ForecastPeriod.Current)
  const tomorrow = danger.find((d) => d.valid_day === ForecastPeriod.Tomorrow)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Danger Rating</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {today && (
          <DangerDay label="Today" forecast={today} elevationBandNames={elevationBandNames} />
        )}
        {tomorrow && (
          <DangerDay
            label="Tomorrow Outlook"
            forecast={tomorrow}
            elevationBandNames={elevationBandNames}
          />
        )}
      </CardContent>
    </Card>
  )
}

interface DangerDayProps {
  label: string
  forecast: AvalancheDangerForecast
  elevationBandNames: ElevationBandNames
}

function DangerDay({ label, forecast, elevationBandNames }: DangerDayProps) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold">{label}</h4>
      <div className="flex items-start gap-4">
        <DangerTriangle
          upper={forecast.upper}
          middle={forecast.middle}
          lower={forecast.lower}
          className="h-32 w-auto shrink-0"
        />
        <div className="flex flex-1 flex-col gap-2">
          <DangerElevationBand label={elevationBandNames.upper} level={forecast.upper} />
          <DangerElevationBand label={elevationBandNames.middle} level={forecast.middle} />
          <DangerElevationBand label={elevationBandNames.lower} level={forecast.lower} />
        </div>
      </div>
    </div>
  )
}
