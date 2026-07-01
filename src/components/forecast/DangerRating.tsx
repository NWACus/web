/**
 * Avalanche danger section, matching the legacy afp widget. Today gets the detailed treatment —
 * gray rows with white elevation-name pills over a color-coded triangle, the "{level} - {Name}"
 * rating, and the danger diamond icon; tomorrow is a compact outlook (gray rows, rating + icon),
 * so the current day reads as the more important one. Below sit the Elevation Band Descriptions
 * disclosure and the danger-scale legend. The compact all-zones card passes no dates and renders
 * both days compactly without the legend.
 */
import Image from 'next/image'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { validDateHeading } from '@/services/nac/archiveDates'
import { dangerIconUrl, dangerLevelLabel, dangerName } from '@/services/nac/dangerScale'
import {
  type AvalancheDangerForecast,
  type DangerLevel,
  ForecastPeriod,
} from '@/services/nac/model/forecast'
import type { ElevationBandNames } from '@/services/nac/types/schemas'
import { cn } from '@/utilities/ui'

import { DangerScale } from './DangerScale'
import { DangerTriangle } from './DangerTriangle'
import { ElevationBandDescriptions } from './ElevationBandDescriptions'
import { sanitizeHtml } from './sanitizeHtml'

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
    ? (validDateHeading(publishedTime, timezone, 1) ?? 'Tomorrow')
    : 'Tomorrow'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Avalanche Danger</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Today is wider/detailed; tomorrow is a compact outlook. Side by side from lg. */}
        <div className={cn('flex flex-col gap-6', dated && 'lg:flex-row lg:gap-8')}>
          {today && (
            <div className="lg:flex-[3]">
              <DangerDay
                heading={todayHeading}
                forecast={today}
                elevationBandNames={elevationBandNames}
                variant={dated ? 'detailed' : 'compact'}
              />
            </div>
          )}
          {tomorrow && (
            <div className="lg:flex-[2]">
              <DangerDay
                heading={tomorrowHeading}
                forecast={tomorrow}
                elevationBandNames={elevationBandNames}
                variant="compact"
              />
            </div>
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
  variant: 'detailed' | 'compact'
}

function DangerDay({ heading, forecast, elevationBandNames, variant }: DangerDayProps) {
  const bands: { label: string; level: DangerLevel }[] = [
    { label: elevationBandNames.upper, level: forecast.upper },
    { label: elevationBandNames.middle, level: forecast.middle },
    { label: elevationBandNames.lower, level: forecast.lower },
  ]

  if (variant === 'compact') {
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-semibold">{heading}</h4>
        <div className="flex flex-col gap-1">
          {bands.map((band, i) => (
            <div key={i} className="flex items-center gap-3 rounded bg-muted px-3 py-3">
              {/* Muted single-line band label (br collapsed) keeps the outlook compact. */}
              <span
                className="min-w-0 flex-1 truncate text-xs text-muted-foreground [&_br]:hidden"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(band.label) }}
              />
              <span className="font-semibold">{dangerLevelLabel(band.level)}</span>
              <Image
                src={dangerIconUrl(band.level)}
                alt={dangerName(band.level)}
                width={36}
                height={36}
                className="shrink-0"
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold">{heading}</h4>
      {/* Three stacked layers: gray row backgrounds, the color-coded triangle, then the content
          (white elevation pills over the triangle + rating + diamond icon). */}
      <div className="relative">
        <div className="absolute inset-0 flex flex-col gap-1">
          {bands.map((_, i) => (
            <div key={i} className="flex-1 rounded bg-muted" />
          ))}
        </div>
        <DangerTriangle
          upper={forecast.upper}
          middle={forecast.middle}
          lower={forecast.lower}
          className="pointer-events-none absolute left-2 top-0 h-full w-auto"
        />
        <div className="relative flex flex-col gap-1">
          {bands.map((band, i) => (
            <div key={i} className="flex min-h-[64px] items-center gap-2 px-2">
              {/* Elevation labels may contain HTML (e.g. "Upper Elevations <br> 7500-5500ft") */}
              <span
                className="max-w-[45%] rounded border bg-background px-2 py-1 text-xs font-semibold leading-tight text-muted-foreground shadow-sm"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(band.label) }}
              />
              <span className="ml-auto text-base font-bold sm:text-lg">
                {dangerLevelLabel(band.level)}
              </span>
              <Image
                src={dangerIconUrl(band.level)}
                alt={dangerName(band.level)}
                width={44}
                height={44}
                className="shrink-0"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
