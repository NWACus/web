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

import { CollapsibleOutlook } from './CollapsibleOutlook.client'
import { DangerScale } from './DangerScale'
import { DangerTriangle } from './DangerTriangle'
import { ExternalLink } from './ExternalLink'
import { HelpHeading } from './HelpHeading'
import { TravelAdviceColumn } from './TravelAdviceColumn'
import { dangerHeadings, isNoRatingDay, type DangerHeadings } from './dangerRatingLayout'
import { sectionHeading } from './forecastHeadings'
import { AVALANCHE_DANGER_HELP } from './forecastHelp'
import { sanitizeHtml } from './sanitizeHtml'

interface DangerRatingProps {
  danger: AvalancheDangerForecast[]
  elevationBandNames: ElevationBandNames
  /** Published time of the product — when set, day columns are headed by real valid dates. */
  publishedTime?: string
  /** Center timezone for the noon valid-date rule. */
  timezone?: string | null
  /** The center's elevation-band explainer, linked under the dated view's ratings when it has one. */
  elevationBandsUrl?: string | null
}

export function DangerRating({
  danger,
  elevationBandNames,
  publishedTime,
  timezone,
  elevationBandsUrl,
}: DangerRatingProps) {
  const today = danger.find((d) => d.valid_day === ForecastPeriod.Current)
  const tomorrow = danger.find((d) => d.valid_day === ForecastPeriod.Tomorrow)
  const headings = dangerHeadings(publishedTime, timezone)

  return (
    <section className="space-y-4">
      {/* The ⓘ belongs to the zone page's section; the all-zones card keeps its plain heading. */}
      {headings.dated ? (
        <HelpHeading
          title="Avalanche Danger"
          help={AVALANCHE_DANGER_HELP}
          helpLabel="About Avalanche Danger"
        />
      ) : (
        <h2 className={sectionHeading}>Avalanche Danger</h2>
      )}
      <DangerDayColumns
        today={today}
        tomorrow={tomorrow}
        headings={headings}
        elevationBandNames={elevationBandNames}
      />
      {headings.dated && (
        <DatedDangerExtras
          noRatingToday={isNoRatingDay(today)}
          adviceBesideToday={!tomorrow}
          elevationBandsUrl={elevationBandsUrl}
        />
      )}
    </section>
  )
}

/**
 * On the dated view today takes the widget's 8 of 12 columns with the triangle, and the right-hand
 * 4 hold tomorrow's outlook, side by side from lg. Below lg the outlook folds into a collapsed row
 * under today. The compact card stacks both days without the triangle.
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
  if (!headings.dated) {
    return (
      <div className="flex flex-col gap-6">
        <DayColumn
          heading={headings.today}
          forecast={today}
          elevationBandNames={elevationBandNames}
          variant="compact"
        />
        <DayColumn
          heading={headings.tomorrow}
          forecast={tomorrow}
          elevationBandNames={elevationBandNames}
          variant="compact"
        />
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-[30px] printWide:flex-row printWide:gap-[30px]">
        <DayColumn
          className="lg:flex-[2] printWide:flex-[2]"
          heading={headings.today}
          forecast={today}
          elevationBandNames={elevationBandNames}
          variant="today"
        />
        <BesideToday
          today={today}
          tomorrow={tomorrow}
          heading={headings.tomorrow}
          elevationBandNames={elevationBandNames}
        />
      </div>
      {tomorrow && (
        <CollapsibleOutlook heading={headings.tomorrow} className="lg:hidden printWide:hidden">
          <OutlookSummary forecast={tomorrow} elevationBandNames={elevationBandNames} />
        </CollapsibleOutlook>
      )}
    </>
  )
}

/**
 * The desktop column beside today, which phones don't get: tomorrow's outlook or, when the center
 * issued none, today's travel advice for each band, as the widget does. Print follows desktop.
 */
function BesideToday({
  today,
  tomorrow,
  heading,
  elevationBandNames,
}: {
  today: AvalancheDangerForecast | undefined
  tomorrow: AvalancheDangerForecast | undefined
  heading: string
  elevationBandNames: ElevationBandNames
}) {
  const className = 'hidden lg:block lg:flex-1 printWide:block printWide:flex-1'

  if (tomorrow) {
    return (
      <DayColumn
        className={className}
        heading={heading}
        forecast={tomorrow}
        elevationBandNames={elevationBandNames}
        variant="outlook"
      />
    )
  }
  if (today) return <TravelAdviceColumn danger={today} className={className} />
  return null
}

function DayColumn({
  className,
  forecast,
  ...day
}: Omit<DangerDayProps, 'forecast'> & {
  className?: string
  forecast: AvalancheDangerForecast | undefined
}) {
  if (!forecast) return null

  return (
    <div className={className}>
      <DangerDay forecast={forecast} {...day} />
    </div>
  )
}

/**
 * The outlook inside the phone's collapsed row, as the widget draws it: a small triangle beside the
 * three ratings, each row a third of the triangle's height.
 */
function OutlookSummary({
  forecast,
  elevationBandNames,
}: {
  forecast: AvalancheDangerForecast
  elevationBandNames: ElevationBandNames
}) {
  return (
    <div className="mt-3 flex justify-center gap-4">
      <DangerTriangle
        upper={forecast.upper}
        middle={forecast.middle}
        lower={forecast.lower}
        className="h-[150px] w-auto shrink-0"
      />
      <ul>
        {dangerBands(forecast, elevationBandNames).map((band, i) => (
          <li key={i} className="flex h-[50px] items-center gap-3 font-bold">
            {/* Elevation labels may contain HTML (e.g. "Upper Elevations <br> 7500-5500ft") */}
            <span
              className="sr-only"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(band.label) }}
            />
            {dangerLevelLabel(band.level)}
            <DangerIcon level={band.level} className="h-[30px] w-auto" />
          </li>
        ))}
      </ul>
    </div>
  )
}

/** The explanatory material shown only on the full dated view, not the compact all-zones card. */
function DatedDangerExtras({
  noRatingToday,
  adviceBesideToday,
  elevationBandsUrl,
}: {
  noRatingToday: boolean
  adviceBesideToday: boolean
  elevationBandsUrl: string | null | undefined
}) {
  return (
    <>
      {/* No Rating everywhere today → the legacy explanation pointing to the summary. Not beside
          the travel-advice column, which already says it for each band (as the widget does). */}
      {noRatingToday && (
        <p
          className={cn(
            'text-sm text-muted-foreground',
            adviceBesideToday && 'lg:hidden printWide:hidden',
          )}
        >
          {NO_RATING_ADVICE}
        </p>
      )}
      {elevationBandsUrl && (
        <ExternalLink href={elevationBandsUrl} className="text-sm text-muted-foreground">
          Elevation Band Descriptions
        </ExternalLink>
      )}
      <DangerScale />
    </>
  )
}

/**
 * `today` draws the triangle behind the rows; `outlook` sits beside today on desktop, its rows lined
 * up with today's, so it drops the elevation labels; `compact` is the all-zones card, labels always
 * and no triangle.
 */
type DangerDayVariant = 'today' | 'outlook' | 'compact'

interface DangerDayProps {
  heading: string
  forecast: AvalancheDangerForecast
  elevationBandNames: ElevationBandNames
  variant: DangerDayVariant
}

function dangerBands(
  forecast: AvalancheDangerForecast,
  elevationBandNames: ElevationBandNames,
): { label: string; level: DangerLevel }[] {
  return [
    { label: elevationBandNames.upper, level: forecast.upper },
    { label: elevationBandNames.middle, level: forecast.middle },
    { label: elevationBandNames.lower, level: forecast.lower },
  ]
}

function DangerDay({ heading, forecast, elevationBandNames, variant }: DangerDayProps) {
  const bands = dangerBands(forecast, elevationBandNames)

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
  const outlook = variant === 'outlook'

  return (
    <div className="relative mb-[3px] mr-[35px] h-[60px] bg-muted sm:mb-[5px] sm:mr-[45px] sm:h-[90px]">
      {/* Elevation labels may contain HTML (e.g. "Upper Elevations <br> 7500-5500ft") */}
      {!outlook && (
        <span
          className="absolute left-0 top-1/2 z-[1] max-w-[45%] -translate-y-1/2 rounded border bg-background px-2 py-1 text-xs font-semibold leading-tight text-muted-foreground shadow-sm sm:left-[15px]"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(label) }}
        />
      )}
      <span
        className={cn(
          'absolute right-0 top-1/2 z-[1] w-[150px] -translate-y-1/2 text-base font-bold md:w-[30%] sm:text-lg printWide:text-lg',
          outlook &&
            'lg:left-[30px] lg:right-auto lg:w-auto printWide:left-[30px] printWide:right-auto printWide:w-auto',
        )}
      >
        {dangerLevelLabel(level)}
      </span>
      <DangerIcon
        level={level}
        className="absolute left-full top-1/2 z-[1] -ml-5 h-10 w-auto max-w-none -translate-y-1/2 sm:-ml-[25px] sm:h-[50px]"
      />
    </div>
  )
}

function DangerIcon({ level, className }: { level: DangerLevel; className: string }) {
  const size = dangerIconSize(level)

  return (
    <Image
      src={dangerIconUrl(level)}
      alt={dangerName(level)}
      width={size.width}
      height={size.height}
      className={className}
    />
  )
}
