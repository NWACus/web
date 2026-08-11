/**
 * Presentational composition for a single forecast/summary product. Shared by the
 * live forecast page (current product) and the dated history route (a product fetched
 * by id), so both render identically. Pure presentation: it receives already-fetched
 * data and renders — no data fetching here.
 */
import type { ZoneArchiveDate } from '@/services/nac/archiveDates'
import {
  ProductType,
  type ForecastResult,
  type WarningProduct,
  type Weather,
} from '@/services/nac/model/forecast'
import type { ActiveForecastZoneWithSlug } from '@/services/nac/nac'
import type { AvalancheCenterType, ElevationBandNames } from '@/services/nac/types/schemas'

import { AvalancheProblemCard } from './AvalancheProblemCard'
import { BottomLine } from './BottomLine'
import { DangerRating } from './DangerRating'
import { ForecastDatePicker } from './ForecastDatePicker.client'
import { ForecastDisclaimer } from './ForecastDisclaimer'
import { ForecastDiscussion } from './ForecastDiscussion'
import { ForecastErrorBoundary } from './ForecastErrorBoundary'
import { ForecastHeader } from './ForecastHeader'
import { ForecastMediaThumbnails } from './ForecastMediaThumbnails'
import { ValidityBanner } from './ValidityBanner'
import { WarningBanner } from './WarningBanner'
import { WeatherSummary } from './WeatherSummary'
import { bottomLineDangerLevel } from './zoneCardDanger'

interface NativeForecastViewProps {
  center: string
  zone: ActiveForecastZoneWithSlug
  timezone: string | null | undefined
  forecastResult: ForecastResult
  /** Active warning banner — live view only; null for historical/dated views. */
  warning: WarningProduct | null
  /** Dates (with danger) for the picker's server-rendered initial month window. */
  initialDates: ZoneArchiveDate[]
  /** The `from`/`to` (YYYY-MM-DD) window covered by initialDates. */
  initialRange: { from: string; to: string }
  /** Valid date of the current/live product, so the picker can return to the live page. */
  currentDate: string | null
  /** The shown date (`YYYY-MM-DD`), or null when showing the current/live forecast. */
  selectedDate: string | null
  /** Tenant-relative zone base path, e.g. `/forecasts/avalanche/west-slopes-north`. */
  basePath: string
  /** Avalanche center type, for the scope disclaimer's provider wording (USFS vs center name). */
  centerType: AvalancheCenterType
  /** The separately-issued weather product, when one is available (live page only). */
  weather?: Weather | null
}

export function NativeForecastView({
  center,
  zone,
  timezone,
  forecastResult,
  warning,
  initialDates,
  initialRange,
  currentDate,
  selectedDate,
  basePath,
  centerType,
  weather,
}: NativeForecastViewProps) {
  const isForecast = forecastResult.product_type === ProductType.Forecast

  return (
    <div className="container space-y-6 py-6">
      {/* Page header: zone name + the product-type subtitle, matching the afp product titles
          ("Backcountry Avalanche Forecast" / "General Avalanche Information"). */}
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{zone.zone.name}</h1>
        <p className="text-muted-foreground">
          {isForecast ? 'Backcountry Avalanche Forecast' : 'General Avalanche Information'}
        </p>
      </header>

      <ForecastMasthead
        center={center}
        zone={zone}
        timezone={timezone}
        forecastResult={forecastResult}
        warning={warning}
        initialDates={initialDates}
        initialRange={initialRange}
        currentDate={currentDate}
        selectedDate={selectedDate}
        basePath={basePath}
      />

      <ForecastLead
        forecastResult={forecastResult}
        elevationBandNames={zone.zone.config.elevation_band_names}
        timezone={timezone}
      />

      <AvalancheProblems forecastResult={forecastResult} />

      <ForecastSupplements
        forecastResult={forecastResult}
        weather={weather}
        zoneName={zone.zone.name}
        timezone={timezone}
      />

      <ForecastMedia media={forecastResult.media} />

      {/* Scope disclaimer — safety/scope language shown under every afp product */}
      <ForecastDisclaimer
        centerType={centerType}
        centerName={forecastResult.avalanche_center.name}
      />
    </div>
  )
}

/**
 * Everything between the page heading and the forecast content: the history picker, any active
 * warning, the validity banner, and the product's metadata. Each is independently boundaried so
 * one malformed field degrades that strip only.
 */
function ForecastMasthead({
  center,
  zone,
  timezone,
  forecastResult,
  warning,
  initialDates,
  initialRange,
  currentDate,
  selectedDate,
  basePath,
}: Pick<
  NativeForecastViewProps,
  | 'center'
  | 'zone'
  | 'timezone'
  | 'forecastResult'
  | 'warning'
  | 'initialDates'
  | 'initialRange'
  | 'currentDate'
  | 'selectedDate'
  | 'basePath'
>) {
  return (
    <>
      {/* Date picker — browse this zone's published forecast history, colored by danger. */}
      <ForecastErrorBoundary fallbackMessage="Unable to display the date picker">
        <ForecastDatePicker
          center={center}
          zoneSlug={zone.slug}
          zoneName={zone.zone.name}
          basePath={basePath}
          selectedDate={selectedDate}
          currentDate={currentDate}
          initialDates={initialDates.map((d) => ({ date: d.date, dangerRating: d.dangerRating }))}
          initialRange={initialRange}
        />
      </ForecastErrorBoundary>

      {/* Warning banner */}
      <ForecastErrorBoundary fallbackMessage="Unable to display warning information">
        <WarningBanner warning={warning} timezone={timezone} />
      </ForecastErrorBoundary>

      {/* Validity-date banner: archived on a dated view, expired on the live view */}
      <ForecastErrorBoundary fallbackMessage="Unable to display forecast validity">
        <ValidityBanner forecast={forecastResult} selectedDate={selectedDate} basePath={basePath} />
      </ForecastErrorBoundary>

      {/* Header: author, issued, expires */}
      <ForecastErrorBoundary fallbackMessage="Unable to display forecast metadata">
        <ForecastHeader forecast={forecastResult} timezone={timezone} />
      </ForecastErrorBoundary>
    </>
  )
}

/**
 * The bottom line and the per-band danger ratings. The bottom line is rendered above the ratings
 * to match the legacy afp widget, which leads with the forecaster's summary.
 */
function ForecastLead({
  forecastResult,
  elevationBandNames,
  timezone,
}: {
  forecastResult: ForecastResult
  elevationBandNames: ElevationBandNames
  timezone: string | null | undefined
}) {
  return (
    <>
      {forecastResult.bottom_line && (
        <ForecastErrorBoundary fallbackMessage="Unable to display the bottom line">
          <BottomLine
            html={forecastResult.bottom_line}
            dangerLevel={bottomLineDangerLevel(forecastResult)}
          />
        </ForecastErrorBoundary>
      )}

      <DangerRatingSection
        forecastResult={forecastResult}
        elevationBandNames={elevationBandNames}
        timezone={timezone}
      />
    </>
  )
}

/** Only for full forecasts — summary products carry no per-band ratings. */
function DangerRatingSection({
  forecastResult,
  elevationBandNames,
  timezone,
}: {
  forecastResult: ForecastResult
  elevationBandNames: ElevationBandNames
  timezone: string | null | undefined
}) {
  if (forecastResult.product_type !== ProductType.Forecast) return null

  return (
    <ForecastErrorBoundary fallbackMessage="Unable to display danger rating">
      <DangerRating
        danger={forecastResult.danger}
        elevationBandNames={elevationBandNames}
        publishedTime={forecastResult.published_time}
        timezone={timezone}
      />
    </ForecastErrorBoundary>
  )
}

/** Only for full forecasts, headed by the count to match the widget. */
function AvalancheProblems({ forecastResult }: { forecastResult: ForecastResult }) {
  if (forecastResult.product_type !== ProductType.Forecast) return null
  if (forecastResult.forecast_avalanche_problems.length === 0) return null

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold tracking-tight">
        Avalanche Problems ({forecastResult.forecast_avalanche_problems.length})
      </h2>
      {forecastResult.forecast_avalanche_problems.map((problem) => (
        <ForecastErrorBoundary
          key={problem.id}
          fallbackMessage={`Unable to display avalanche problem: ${problem.name}`}
        >
          <AvalancheProblemCard problem={problem} />
        </ForecastErrorBoundary>
      ))}
    </section>
  )
}

/** The discussion, and the separately-issued weather product when one is available. */
function ForecastSupplements({
  forecastResult,
  weather,
  zoneName,
  timezone,
}: {
  forecastResult: ForecastResult
  weather: Weather | null | undefined
  zoneName: string
  timezone: string | null | undefined
}) {
  return (
    <>
      {forecastResult.hazard_discussion && (
        <ForecastErrorBoundary fallbackMessage="Unable to display forecast discussion">
          <ForecastDiscussion html={forecastResult.hazard_discussion} />
        </ForecastErrorBoundary>
      )}

      {weather && (
        <ForecastErrorBoundary fallbackMessage="Unable to display the weather summary">
          <WeatherSummary weather={weather} zoneName={zoneName} timezone={timezone} />
        </ForecastErrorBoundary>
      )}
    </>
  )
}

/** Forecast-level media, as a thumbnail grid opening the lightbox. */
function ForecastMedia({ media }: { media: ForecastResult['media'] }) {
  if (!media || media.length === 0) return null

  return (
    <ForecastErrorBoundary fallbackMessage="Unable to display forecast media">
      <ForecastMediaThumbnails media={media} />
    </ForecastErrorBoundary>
  )
}
