/**
 * Avalanche danger section, matching the legacy afp widget's sizes and placement. Today gets the
 * detailed treatment — gray rows with white elevation-name pills over a color-coded triangle, the
 * "{level} - {Name}" rating, and the danger diamond icon; tomorrow is the outlook (gray rows,
 * rating + icon), so the current day reads as the more important one. Below sit the Elevation Band
 * Descriptions link and the danger-scale legend. The compact all-zones card passes no dates and
 * renders both days compactly without the legend.
 *
 * A section, not a card: the zone page sets it inside the one forecast panel, as the widget did,
 * and the all-zones card wraps it in its own.
 */
import Image from 'next/image'

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
import { sectionHeading } from './forecastHeadings'
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
    <section className="space-y-4">
      <h2 className={sectionHeading}>Avalanche Danger</h2>
      <DangerDayColumns
        today={today}
        tomorrow={tomorrow}
        headings={headings}
        elevationBandNames={elevationBandNames}
      />
      {headings.dated && <DatedDangerExtras noRatingToday={isNoRatingDay(today)} />}
    </section>
  )
}

/**
 * On the dated view today takes the widget's 8 of 12 columns with the triangle, and tomorrow's
 * outlook the remaining 4, side by side from lg. The compact card stacks both days without the
 * triangle.
 */
function DangerDayColumns({
  today,
  tomorrow,
  headings,
  elevationBandNames,
}: {
  today: AvalancheDangerForecast | undefined
  tomorrow: AvalancheDangerForecast | undefined
  headings: DangerHeadings
  elevationBandNames: ElevationBandNames
}) {
  const { dated } = headings

  return (
    <div
      className={cn(
        'flex flex-col gap-6',
        dated && 'lg:flex-row lg:gap-[30px] printWide:flex-row printWide:gap-[30px]',
      )}
    >
      <DayColumn
        className="lg:flex-[2] printWide:flex-[2]"
        heading={headings.today}
        forecast={today}
        elevationBandNames={elevationBandNames}
        variant={dated ? 'today' : 'compact'}
      />
      <DayColumn
        className="lg:flex-1 printWide:flex-1"
        heading={headings.tomorrow}
        forecast={tomorrow}
        elevationBandNames={elevationBandNames}
        variant={dated ? 'outlook' : 'compact'}
      />
    </div>
  )
}

function DayColumn({
  className,
  forecast,
  ...day
}: Omit<DangerDayProps, 'forecast'> & {
  className: string
  forecast: AvalancheDangerForecast | undefined
}) {
  if (!forecast) return null

  return (
    <div className={className}>
      <DangerDay forecast={forecast} {...day} />
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

/**
 * `today` draws the triangle behind the rows; `outlook` drops the elevation labels beside today
 * (its rows line up with today's), keeping them once the columns stack; `compact` is the
 * all-zones card, labels always and no triangle.
 */
type DangerDayVariant = 'today' | 'outlook' | 'compact'

interface DangerDayProps {
  heading: string
  forecast: AvalancheDangerForecast
  elevationBandNames: ElevationBandNames
  variant: DangerDayVariant
}

function DangerDay({ heading, forecast, elevationBandNames, variant }: DangerDayProps) {
  const bands: { label: string; level: DangerLevel }[] = [
    { label: elevationBandNames.upper, level: forecast.upper },
    { label: elevationBandNames.middle, level: forecast.middle },
    { label: elevationBandNames.lower, level: forecast.lower },
  ]

  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold">{heading}</h4>
      {/* Rows, then the triangle over their backgrounds, then the row content over the triangle
          (it is raised with z-[1]) — the widget's stacking. */}
      <div className="relative">
        {bands.map((band, i) => (
          <DangerRow key={i} label={band.label} level={band.level} variant={variant} />
        ))}
        {variant === 'today' && (
          <DangerTriangle
            upper={forecast.upper}
            middle={forecast.middle}
            lower={forecast.lower}
            className="pointer-events-none absolute bottom-0 right-1/2 top-0 h-full w-auto sm:left-[70px] sm:right-auto md:left-[20%]"
          />
        )}
      </div>
    </div>
  )
}

/**
 * One elevation band at the widget's dimensions: a 90px gray row (60px on phones), the rating from
 * 70% across, and a 50px icon centered on the row's right edge, hanging into the row's right margin.
 */
function DangerRow({
  label,
  level,
  variant,
}: {
  label: string
  level: DangerLevel
  variant: DangerDayVariant
}) {
  const size = dangerIconSize(level)
  const outlook = variant === 'outlook'

  return (
    <div className="relative mb-[3px] mr-[35px] h-[60px] bg-muted sm:mb-[5px] sm:mr-[45px] sm:h-[90px]">
      {/* Elevation labels may contain HTML (e.g. "Upper Elevations <br> 7500-5500ft") */}
      <span
        className={cn(
          'absolute left-0 top-1/2 z-[1] max-w-[45%] -translate-y-1/2 rounded border bg-background px-2 py-1 text-xs font-semibold leading-tight text-muted-foreground shadow-sm sm:left-[15px]',
          outlook && 'lg:hidden printWide:hidden',
        )}
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(label) }}
      />
      <span
        className={cn(
          'absolute right-0 top-1/2 z-[1] w-[150px] -translate-y-1/2 text-base font-bold md:w-[30%] sm:text-lg printWide:text-lg',
          outlook &&
            'lg:left-[30px] lg:right-auto lg:w-auto printWide:left-[30px] printWide:right-auto printWide:w-auto',
        )}
      >
        {dangerLevelLabel(level)}
      </span>
      <Image
        src={dangerIconUrl(level)}
        alt={dangerName(level)}
        width={size.width}
        height={size.height}
        className="absolute left-full top-1/2 z-[1] -ml-5 h-10 w-auto max-w-none -translate-y-1/2 sm:-ml-[25px] sm:h-[50px]"
      />
    </div>
  )
}
