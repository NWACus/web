/**
 * One zone's entry in the all-zones listing, laid out like the legacy widget's: the zone name,
 * product metadata, the bottom line, then the danger panel. No border or padding of its own, so
 * the bottom line and danger cards carry the structure.
 *
 * Only the zone name and the button link to the zone's forecast page. The rest is read in place,
 * which leaves links inside the bottom line free to be followed.
 */
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Forecast, ForecastResult, WarningProduct } from '@/services/nac/model/forecast'
import { ProductType } from '@/services/nac/model/forecast'
import type { ElevationBandNames } from '@/services/nac/types/schemas'
import { cn } from '@/utilities/ui'

import { BottomLine } from './BottomLine'
import { DangerRating } from './DangerRating'
import { ForecastErrorBoundary } from './ForecastErrorBoundary'
import { ForecastHeader } from './ForecastHeader'
import { ProductExpiry } from './ProductExpiry'
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
  const href = `/forecasts/avalanche/${zoneSlug}`

  return (
    <div
      // Every visible string in a card ("The Bottom Line", "Today", "Issued") repeats once per
      // zone, so the grid's E2E coverage has no other way to scope an assertion to one card.
      data-testid={`zone-card-${zoneSlug}`}
      className="space-y-4"
    >
      <h2 className="text-2xl font-semibold leading-none tracking-tight">
        <Link href={href} className="hover:underline">
          {zoneName}
        </Link>
      </h2>
      {forecast ? (
        <ZoneForecastCardBody
          href={href}
          zoneName={zoneName}
          forecast={forecast}
          warning={warning}
          elevationBandNames={elevationBandNames}
          timezone={timezone}
        />
      ) : (
        <p className="text-sm text-muted-foreground">Forecast data unavailable.</p>
      )}
    </div>
  )
}

/**
 * Each section is independently boundaried so one malformed field degrades that section only,
 * rather than blanking the whole card.
 */
function ZoneForecastCardBody({
  href,
  zoneName,
  forecast,
  warning,
  elevationBandNames,
  timezone,
}: {
  href: string
  zoneName: string
  forecast: ForecastResult
  warning: WarningProduct | null
  elevationBandNames: ElevationBandNames
  timezone: string | null | undefined
}) {
  const isForecast = forecast.product_type === ProductType.Forecast

  return (
    <>
      <ZoneWarning warning={warning} timezone={timezone} />

      {/* Expiry is the one state the freshness check cannot catch — a product can lapse with no
          replacement published, which is no change at all. The card carries a live danger rating,
          so it needs the same signal the zone page has; the "Expires" time below is a fact to
          read, not a notice that arrives. */}
      <ForecastErrorBoundary fallbackMessage="Unable to display forecast validity">
        <ProductExpiry forecast={forecast} />
      </ForecastErrorBoundary>

      <ForecastErrorBoundary fallbackMessage="Unable to display forecast metadata">
        <ForecastHeader forecast={forecast} timezone={timezone} />
      </ForecastErrorBoundary>

      <ZoneBottomLine forecast={forecast} />

      {isForecast && (
        <ZoneDangerPanel danger={forecast.danger} elevationBandNames={elevationBandNames} />
      )}

      <ZoneCardButton
        href={href}
        label={isForecast ? 'Full Forecast' : 'More Information'}
        zoneName={zoneName}
      />
    </>
  )
}

/** The danger in a panel of its own, as the widget's all-zones view set it. */
function ZoneDangerPanel({
  danger,
  elevationBandNames,
}: {
  danger: Forecast['danger']
  elevationBandNames: ElevationBandNames
}) {
  return (
    <Card>
      <CardContent className="px-4 py-8 sm:px-6">
        <ForecastErrorBoundary fallbackMessage="Unable to display danger rating">
          <DangerRating danger={danger} elevationBandNames={elevationBandNames} />
        </ForecastErrorBoundary>
      </CardContent>
    </Card>
  )
}

/** The zone name rides along for screen readers, since every entry's button reads the same. */
function ZoneCardButton({
  href,
  label,
  zoneName,
}: {
  href: string
  label: string
  zoneName: string
}) {
  return (
    <div className="flex justify-end">
      <Link
        href={href}
        aria-label={`${label}: ${zoneName}`}
        className={cn(buttonVariants(), 'group gap-2')}
      >
        {label}
        <ArrowRight
          className="h-4 w-4 transition-transform group-hover:translate-x-1 group-focus-visible:translate-x-1"
          aria-hidden="true"
        />
      </Link>
    </div>
  )
}

function ZoneWarning({
  warning,
  timezone,
}: {
  warning: WarningProduct | null
  timezone: string | null | undefined
}) {
  if (!warning) return null

  return (
    <ForecastErrorBoundary fallbackMessage="Unable to display warning">
      <WarningBanner warning={warning} timezone={timezone} />
    </ForecastErrorBoundary>
  )
}

function ZoneBottomLine({ forecast }: { forecast: ForecastResult }) {
  if (!forecast.bottom_line) return null

  return (
    <ForecastErrorBoundary fallbackMessage="Unable to display the bottom line">
      <BottomLine html={forecast.bottom_line} dangerLevel={bottomLineDangerLevel(forecast)} />
    </ForecastErrorBoundary>
  )
}
