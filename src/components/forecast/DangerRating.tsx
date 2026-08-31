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
import {
  ELEVATION_BANDS_URL,
  NO_RATING_ADVICE,
  dangerIconSize,
  dangerIconUrl,
  dangerLevelLabel,
  dangerName,
} from '@/services/nac/dangerScale'
import {
  DangerLevel,
  ForecastPeriod,
  type AvalancheDangerForecast,
} from '@/services/nac/model/forecast'
import type { ElevationBandNames } from '@/services/nac/types/schemas'
import { cn } from '@/utilities/ui'

import { DangerScale } from './DangerScale'
import { DangerTriangle } from './DangerTriangle'
import { ExternalLink } from './ExternalLink'
import { dangerHeadings, isNoRatingDay, type DangerHeadings } from './dangerRatingLayout'
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
  const headings = dangerHeadings(publishedTime, timezone)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Avalanche Danger</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 print:space-y-4">
        <DangerDayColumns
          today={today}
          tomorrow={tomorrow}
          headings={headings}
          elevationBandNames={elevationBandNames}
          // Today is wider/detailed on the dated view; the compact card renders both days compactly.
          className={cn(
            'flex flex-col gap-6',
            headings.dated && 'lg:flex-row lg:gap-8 printWide:flex-row printWide:gap-8',
          )}
          todayVariant={headings.dated ? 'detailed' : 'compact'}
        />
        {headings.dated && <DatedDangerExtras noRatingToday={isNoRatingDay(today)} />}
      </CardContent>
    </Card>
  )
}

/** Today is wider/detailed; tomorrow is a compact outlook. Side by side from lg. */
function DangerDayColumns({
  today,
  tomorrow,
  headings,
  elevationBandNames,
  className,
  todayVariant,
}: {
  today: AvalancheDangerForecast | undefined
  tomorrow: AvalancheDangerForecast | undefined
  headings: DangerHeadings
  elevationBandNames: ElevationBandNames
  className: string
  todayVariant: 'detailed' | 'compact'
}) {
  return (
    <div className={className}>
      {today && (
        <div className="lg:flex-[3] printWide:flex-[3]">
          <DangerDay
            heading={headings.today}
            forecast={today}
            elevationBandNames={elevationBandNames}
            variant={todayVariant}
          />
        </div>
      )}
      {tomorrow && (
        <div className="lg:flex-[2] printWide:flex-[2]">
          <DangerDay
            heading={headings.tomorrow}
            forecast={tomorrow}
            elevationBandNames={elevationBandNames}
            variant="compact"
          />
        </div>
      )}
    </div>
  )
}

/** The explanatory material shown only on the full dated view, not the compact all-zones card. */
function DatedDangerExtras({ noRatingToday }: { noRatingToday: boolean }) {
  return (
    <>
      {/* No Rating everywhere today → show the legacy explanation pointing to the summary. */}
      {noRatingToday && <p className="text-sm text-muted-foreground">{NO_RATING_ADVICE}</p>}
      <ExternalLink href={ELEVATION_BANDS_URL} className="text-sm text-muted-foreground">
        Elevation Band Descriptions
      </ExternalLink>
      <DangerScale />
    </>
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
          {bands.map((band, i) => {
            const size = dangerIconSize(band.level)
            return (
              <div key={i} className="flex min-h-[64px] items-center gap-3 rounded bg-muted px-3">
                {/* Muted single-line band label (br collapsed) keeps the outlook compact. */}
                <span
                  className="min-w-0 flex-1 truncate text-xs text-muted-foreground [&_br]:hidden"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(band.label) }}
                />
                <span className="font-semibold">{dangerLevelLabel(band.level)}</span>
                <Image
                  src={dangerIconUrl(band.level)}
                  alt={dangerName(band.level)}
                  width={size.width}
                  height={size.height}
                  className="h-9 w-auto shrink-0"
                />
              </div>
            )
          })}
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
          {bands.map((band, i) => {
            const size = dangerIconSize(band.level)
            return (
              <div key={i} className="flex min-h-[64px] items-center gap-2 px-2">
                {/* Elevation labels may contain HTML (e.g. "Upper Elevations <br> 7500-5500ft") */}
                <span
                  className="max-w-[45%] rounded border bg-background px-2 py-1 text-xs font-semibold leading-tight text-muted-foreground shadow-sm"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(band.label) }}
                />
                <span className="ml-auto text-base font-bold sm:text-lg printWide:text-lg">
                  {dangerLevelLabel(band.level)}
                </span>
                <Image
                  src={dangerIconUrl(band.level)}
                  alt={dangerName(band.level)}
                  width={size.width}
                  height={size.height}
                  className="h-11 w-auto shrink-0"
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
