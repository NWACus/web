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
  type MediaItem,
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
import { ForecastPrint } from './ForecastPrint.client'
import { ValidityBanner } from './ValidityBanner'
import { WarningBanner } from './WarningBanner'
import { WeatherSummary } from './WeatherSummary'
import { availablePrintSections, forecastPrintFilename } from './forecastPrintSections'
import { toLightboxMediaList } from './lightboxMedia'
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
  return (
    // `print:py-0` / `print:space-y-4`: the @page margin already frames the sheet, and screen
    // rhythm costs about three quarters of an inch before the bottom line — enough to decide
    // whether the danger card clears the first page boundary. See print.css.
    <div className="container space-y-6 py-6 print:space-y-4 print:py-0">
      <ForecastTitleRow
        center={center}
        zone={zone}
        forecastResult={forecastResult}
        weather={weather}
        currentDate={currentDate}
        selectedDate={selectedDate}
      />

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

      {/* `data-print-section` marks what the print dialog's checkboxes toggle; the print
          stylesheet in print.css hides any section the reader left unchecked. */}
      <div data-print-section="bottomLine" className="space-y-6 print:space-y-4">
        <ForecastLead
          forecastResult={forecastResult}
          elevationBandNames={zone.zone.config.elevation_band_names}
          timezone={timezone}
        />
      </div>

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
 * The product's title row: zone name and product-type subtitle on the left, the print control on
 * the right — the same arrangement the legacy afp widget used.
 *
 * A div rather than a `<header>`: the print stylesheet hides the site's `<header>`/`<footer>`/
 * `<nav>` chrome wholesale, and this row has to survive that.
 */
function ForecastTitleRow({
  center,
  zone,
  forecastResult,
  weather,
  currentDate,
  selectedDate,
}: Pick<
  NativeForecastViewProps,
  'center' | 'zone' | 'forecastResult' | 'weather' | 'currentDate' | 'selectedDate'
>) {
  const isForecast = forecastResult.product_type === ProductType.Forecast

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl printWide:text-3xl">
          {zone.zone.name}
        </h1>
        <p className="text-muted-foreground">
          {isForecast ? 'Backcountry Avalanche Forecast' : 'General Avalanche Information'}
        </p>
      </div>

      <ForecastErrorBoundary fallbackMessage="Unable to display the print control">
        <ForecastPrint
          availableSections={availablePrintSections(forecastResult, weather)}
          filename={forecastPrintFilename({
            centerSlug: center,
            zoneName: zone.zone.name,
            productType: forecastResult.product_type,
            validDate: selectedDate ?? currentDate ?? '',
          })}
          centerName={forecastResult.avalanche_center.name}
          centerUrl={forecastResult.avalanche_center.url}
        />
      </ForecastErrorBoundary>
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
      {/* Date picker — browse this zone's published forecast history, colored by danger.
          Screen-only: an interactive calendar is noise on paper. */}
      <ForecastErrorBoundary fallbackMessage="Unable to display the date picker">
        <div data-print-hide>
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
        </div>
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
    <section data-print-section="problems" className="space-y-4">
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
        <div data-print-section="discussion">
          <ForecastErrorBoundary fallbackMessage="Unable to display forecast discussion">
            <ForecastDiscussion html={forecastResult.hazard_discussion} />
          </ForecastErrorBoundary>
        </div>
      )}

      {weather && (
        <div data-print-section="weather">
          <ForecastErrorBoundary fallbackMessage="Unable to display the weather summary">
            <WeatherSummary weather={weather} zoneName={zoneName} timezone={timezone} />
          </ForecastErrorBoundary>
        </div>
      )}
    </>
  )
}

/** Forecast-level media, as a thumbnail grid opening the lightbox. */
function ForecastMedia({ media }: { media: ForecastResult['media'] }) {
  if (!media || media.length === 0) return null

  // Screen-only, matching the legacy print: the gallery is a lightbox trigger, and its photos
  // would balloon the printed page for no gain on paper.
  return (
    <div data-print-hide>
      <ForecastErrorBoundary fallbackMessage="Unable to display forecast media">
        <ForecastMediaGrid media={media} />
      </ForecastErrorBoundary>
    </div>
  )
}

/**
 * Prepares the media for the grid, which is a client component: the captions are forecaster-authored
 * HTML, so sanitizing them anywhere downstream of here would ship `sanitize-html` to every reader.
 *
 * Its own component rather than a call inlined above, so the work happens *inside* the boundary —
 * a caption that trips the sanitizer costs the media strip, not the forecast.
 */
function ForecastMediaGrid({ media }: { media: MediaItem[] }) {
  return <ForecastMediaThumbnails media={toLightboxMediaList(media)} />
}
