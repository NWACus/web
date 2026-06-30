/**
 * Avalanche danger section: today + tomorrow as side-by-side date-headed columns (each with its
 * own triangle and per-band "{level} - {Name}" ratings), an Elevation Band Descriptions
 * disclosure, and the danger-scale legend. On the compact all-zones card no dates are passed, so
 * it falls back to stacked "Today" / "Tomorrow Outlook" labels and omits the legend/descriptions.
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { validDateHeading } from '@/services/nac/archiveDates'
import { type AvalancheDangerForecast, ForecastPeriod } from '@/services/nac/model/forecast'
import type { ElevationBandNames } from '@/services/nac/types/schemas'
import { cn } from '@/utilities/ui'

import { DangerElevationBand } from './DangerElevationBand'
import { DangerScale } from './DangerScale'
import { DangerTriangle } from './DangerTriangle'
import { ElevationBandDescriptions } from './ElevationBandDescriptions'

interface DangerRatingProps {
  danger: AvalancheDangerForecast[]
  elevationBandNames: ElevationBandNames
  /** Published time of the product — when set, day columns are headed by real valid dates. */
  publishedTime?: string
  /** Center timezone for the noon valid-date rule. */
  timezone?: string | null
}

export function DangerRating({
  danger,
  elevationBandNames,
  publishedTime,
  timezone,
}: DangerRatingProps) {
  const today = danger.find((d) => d.valid_day === ForecastPeriod.Current)
  const tomorrow = danger.find((d) => d.valid_day === ForecastPeriod.Tomorrow)

  // The full dated view passes a published time; the compact all-zones card does not.
  const dated = publishedTime != null
  const todayHeading = dated ? (validDateHeading(publishedTime, timezone, 0) ?? 'Today') : 'Today'
  const tomorrowHeading = dated
    ? (validDateHeading(publishedTime, timezone, 1) ?? 'Tomorrow Outlook')
    : 'Tomorrow Outlook'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Avalanche Danger</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Side-by-side day columns on the dated view; stacked on the compact card and at <=375px. */}
        <div className={cn('flex flex-col gap-6', dated && 'min-[376px]:flex-row')}>
          {today && (
            <DangerDay
              heading={todayHeading}
              forecast={today}
              elevationBandNames={elevationBandNames}
            />
          )}
          {tomorrow && (
            <DangerDay
              heading={tomorrowHeading}
              forecast={tomorrow}
              elevationBandNames={elevationBandNames}
            />
          )}
        </div>

        {dated && <ElevationBandDescriptions elevationBandNames={elevationBandNames} />}
        {dated && <DangerScale />}
      </CardContent>
    </Card>
  )
}

interface DangerDayProps {
  heading: string
  forecast: AvalancheDangerForecast
  elevationBandNames: ElevationBandNames
}

function DangerDay({ heading, forecast, elevationBandNames }: DangerDayProps) {
  return (
    <div className="flex-1 space-y-3">
      <h4 className="text-sm font-semibold">{heading}</h4>
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
