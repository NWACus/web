/**
 * Presentational composition for a single forecast/summary product. Shared by the
 * live forecast page (current product) and the dated history route (a product fetched
 * by id), so both render identically. Pure presentation: it receives already-fetched
 * data and renders — no data fetching here.
 *
 * The layout follows the legacy afp widget: metadata and the bottom line above one panel that
 * holds the rest of the forecast as headed sections, in the widget's order — danger, problems,
 * discussion, media, mountain weather.
 */
import type { ReactNode } from 'react'

import type { ForecastPickerSettings, ZoneArchiveDate } from '@/services/nac/archiveDates'
import {
  ProductType,
  type AvalancheProblem,
  type ForecastResult,
  type MediaItem,
  type WarningProduct,
  type Weather,
} from '@/services/nac/model/forecast'
import { productTypeTitle } from '@/services/nac/productTypeTitle'
import type { ForecastZoneFacts } from '@/services/nac/resolveZone'
import type { AvalancheCenterType, ElevationBandNames } from '@/services/nac/types/schemas'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/utilities/ui'

import { AvalancheProblemCard } from './AvalancheProblemCard'
import { BottomLine } from './BottomLine'
import { DangerRating } from './DangerRating'
import { ForecastDatePicker } from './ForecastDatePicker.client'
import { ForecastDisclaimer } from './ForecastDisclaimer'
import { ForecastDiscussion } from './ForecastDiscussion'
import { ForecastErrorBoundary } from './ForecastErrorBoundary'
import { ForecastHeader } from './ForecastHeader'
import { sectionHeading } from './forecastHeadings'
import { ForecastMediaThumbnails } from './ForecastMediaThumbnails'
import { ForecastPrint } from './ForecastPrint.client'
import {
  availablePrintSections,
  forecastPrintFilename,
  type PrintSection,
} from './forecastPrintSections'
import { toLightboxMediaList } from './lightboxMedia'
import { ValidityBanner } from './ValidityBanner'
import { WarningBanner } from './WarningBanner'
import { WeatherSummary } from './WeatherSummary'
import { bottomLineDangerLevel } from './zoneCardDanger'
import { zoneWeather } from './zoneWeather'

interface NativeForecastViewProps {
  center: string
  /** `active` is false only on a retired zone's dated page: that zone has no live page. */
  zone: { slug: string; zone: ForecastZoneFacts; active?: boolean }
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
  /** The picker's calendar range and zone heading, from the center's configuration. */
  pickerSettings: ForecastPickerSettings
  /** What the view needs from the center's metadata. */
  centerDetails: ForecastCenterDetails
  /** The separately-issued weather product, when one is available (live page only). */
  weather?: Weather | null
}

/** One prop, so the view's signature doesn't grow with each setting it reads from the center. */
interface ForecastCenterDetails {
  /** Avalanche center type, for the scope disclaimer's provider wording (USFS vs center name). */
  type: AvalancheCenterType
  /** The center's elevation-band explainer page, or null when it has none. */
  elevationBandsUrl: string | null
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
  pickerSettings,
  centerDetails,
  weather,
}: NativeForecastViewProps) {
  return (
    // `print:py-0` / `print:space-y-4`: the @page margin already frames the sheet, and screen
    // rhythm costs about three quarters of an inch before the bottom line — enough to decide
    // whether the danger card clears the first page boundary. See print.css.
    <div className="container space-y-6 py-6 print:space-y-4 print:py-0">
      <DatePickerSection
        center={center}
        zone={zone}
        initialDates={initialDates}
        initialRange={initialRange}
        currentDate={currentDate}
        selectedDate={selectedDate}
        basePath={basePath}
        pickerSettings={pickerSettings}
      />

      <ForecastValidityNotice
        forecastResult={forecastResult}
        selectedDate={selectedDate}
        basePath={basePath}
        hasLivePage={zone.active !== false}
      />

      <ForecastTitleRow
        center={center}
        zone={zone}
        forecastResult={forecastResult}
        weather={weather}
        currentDate={currentDate}
        selectedDate={selectedDate}
      />

      <ForecastMasthead timezone={timezone} forecastResult={forecastResult} warning={warning} />

      {/* `data-print-section` marks what the print dialog's checkboxes toggle; the print
          stylesheet in print.css hides any section the reader left unchecked. */}
      {forecastResult.bottom_line && (
        <div data-print-section="bottomLine">
          <ForecastErrorBoundary fallbackMessage="Unable to display the bottom line">
            <BottomLine
              html={forecastResult.bottom_line}
              dangerLevel={bottomLineDangerLevel(forecastResult)}
            />
          </ForecastErrorBoundary>
        </div>
      )}

      <ForecastPanel
        forecastResult={forecastResult}
        weather={weather}
        elevationBandNames={zone.zone.config.elevation_band_names}
        zoneId={zone.zone.zone_id}
        timezone={timezone}
        elevationBandsUrl={centerDetails.elevationBandsUrl}
      />

      {/* Scope disclaimer — safety/scope language shown under every afp product */}
      <ForecastDisclaimer
        centerType={centerDetails.type}
        centerName={forecastResult.avalanche_center.name}
      />
    </div>
  )
}

/**
 * The date picker — browse this zone's published forecast history, colored by danger.
 * Screen-only: an interactive calendar is noise on paper. Each day ships only what the calendar
 * draws, not the product id it resolves to server-side.
 */
function DatePickerSection({
  center,
  zone,
  initialDates,
  initialRange,
  currentDate,
  selectedDate,
  basePath,
  pickerSettings,
}: Pick<
  NativeForecastViewProps,
  | 'center'
  | 'zone'
  | 'initialDates'
  | 'initialRange'
  | 'currentDate'
  | 'selectedDate'
  | 'basePath'
  | 'pickerSettings'
>) {
  return (
    <ForecastErrorBoundary fallbackMessage="Unable to display the date picker">
      <div data-print-hide>
        <ForecastDatePicker
          center={center}
          zoneSlug={zone.slug}
          zoneName={zone.zone.name}
          basePath={basePath}
          selectedDate={selectedDate}
          currentDate={currentDate}
          initialDates={initialDates.map(({ date, dangerRating, dangerLevelText, danger }) => ({
            date,
            dangerRating,
            dangerLevelText,
            danger,
          }))}
          initialRange={initialRange}
          calendarStart={pickerSettings.calendarStart}
          showZoneName={pickerSettings.showZoneName}
        />
      </div>
    </ForecastErrorBoundary>
  )
}

/**
 * The validity-date banner: archived on a dated view, expired on the live view. Above the title,
 * as the widget had it; unlike the date picker, it prints.
 */
function ForecastValidityNotice({
  forecastResult,
  selectedDate,
  basePath,
  hasLivePage,
}: Pick<NativeForecastViewProps, 'forecastResult' | 'selectedDate' | 'basePath'> & {
  hasLivePage: boolean
}) {
  return (
    <ForecastErrorBoundary fallbackMessage="Unable to display forecast validity">
      <ValidityBanner
        forecast={forecastResult}
        selectedDate={selectedDate}
        basePath={basePath}
        hasLivePage={hasLivePage}
      />
    </ForecastErrorBoundary>
  )
}

/**
 * The product's title row: the product-type title over the zone name on the left, the print
 * control on the right — the same arrangement the legacy afp widget used. Both lines sit in the
 * one `<h1>`, so the page's heading names the zone as well as the product.
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
  return (
    <div className="flex items-start justify-between gap-4">
      <h1 className="space-y-1">
        <span className="block text-2xl font-bold tracking-tight sm:text-3xl printWide:text-3xl">
          {productTypeTitle(forecastResult.product_type)}
        </span>{' '}
        <span className="block text-lg font-semibold tracking-tight text-muted-foreground sm:text-xl printWide:text-xl">
          {zone.zone.name}
        </span>
      </h1>

      <ForecastErrorBoundary fallbackMessage="Unable to display the print control">
        <ForecastPrint
          availableSections={availablePrintSections(forecastResult, weather, zone.zone.zone_id)}
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
 * Everything between the page heading and the bottom line: any active warning and the product's
 * metadata, in the widget's order. Each is independently boundaried so one malformed field
 * degrades that strip only.
 */
function ForecastMasthead({
  timezone,
  forecastResult,
  warning,
}: Pick<NativeForecastViewProps, 'timezone' | 'forecastResult' | 'warning'>) {
  return (
    <>
      {/* Warning banner */}
      <ForecastErrorBoundary fallbackMessage="Unable to display warning information">
        <WarningBanner warning={warning} timezone={timezone} />
      </ForecastErrorBoundary>

      {/* Header: issued, expires, author */}
      <ForecastErrorBoundary fallbackMessage="Unable to display forecast metadata">
        <ForecastHeader forecast={forecastResult} timezone={timezone} />
      </ForecastErrorBoundary>
    </>
  )
}

interface ForecastPanelProps {
  forecastResult: ForecastResult
  weather: Weather | null | undefined
  elevationBandNames: ElevationBandNames
  /** The zone's short `zone_id` string, which picks its Mountain Weather table. */
  zoneId: string
  timezone: string | null | undefined
  elevationBandsUrl: string | null
}

/**
 * The widget's single content panel: each section below the first is set off by a rule rather
 * than a card of its own. Summary products carry no danger or problems, so they start at the
 * discussion.
 */
function ForecastPanel(props: ForecastPanelProps) {
  if (!hasPanelContent(props)) return null

  return (
    <Card>
      <CardContent className="divide-y-[1.5px] px-4 py-8 sm:px-6">
        <DangerPanelSection {...props} />
        <ProblemsPanelSection {...props} />
        <DiscussionPanelSection {...props} />
        <MediaPanelSection {...props} />
        <WeatherPanelSection {...props} />
      </CardContent>
    </Card>
  )
}

function hasPanelContent({ forecastResult, weather, zoneId }: ForecastPanelProps): boolean {
  return (
    forecastResult.product_type === ProductType.Forecast ||
    Boolean(forecastResult.hazard_discussion) ||
    hasMedia(forecastResult) ||
    zoneWeather(weather, zoneId) !== null
  )
}

function hasMedia(forecastResult: ForecastResult): boolean {
  return (forecastResult.media?.length ?? 0) > 0
}

/** Printed under "Bottom Line & Danger", which the widget gated on a single checkbox. */
function DangerPanelSection({
  forecastResult,
  elevationBandNames,
  timezone,
  elevationBandsUrl,
}: ForecastPanelProps) {
  if (forecastResult.product_type !== ProductType.Forecast) return null

  return (
    <PanelSection printSection="bottomLine">
      <ForecastErrorBoundary fallbackMessage="Unable to display danger rating">
        <DangerRating
          danger={forecastResult.danger}
          elevationBandNames={elevationBandNames}
          publishedTime={forecastResult.published_time}
          timezone={timezone}
          elevationBandsUrl={elevationBandsUrl}
        />
      </ForecastErrorBoundary>
    </PanelSection>
  )
}

function ProblemsPanelSection({ forecastResult, elevationBandNames }: ForecastPanelProps) {
  if (forecastResult.product_type !== ProductType.Forecast) return null
  if (forecastResult.forecast_avalanche_problems.length === 0) return null

  return (
    <PanelSection printSection="problems">
      <AvalancheProblems
        problems={forecastResult.forecast_avalanche_problems}
        elevationBandNames={elevationBandNames}
      />
    </PanelSection>
  )
}

function DiscussionPanelSection({ forecastResult }: ForecastPanelProps) {
  if (!forecastResult.hazard_discussion) return null

  return (
    <PanelSection printSection="discussion">
      <ForecastErrorBoundary fallbackMessage="Unable to display forecast discussion">
        <ForecastDiscussion html={forecastResult.hazard_discussion} />
      </ForecastErrorBoundary>
    </PanelSection>
  )
}

/**
 * Screen-only, matching the legacy print: the gallery is a lightbox trigger, and its photos would
 * balloon the printed page for no gain on paper.
 */
function MediaPanelSection({ forecastResult }: ForecastPanelProps) {
  if (!forecastResult.media || !hasMedia(forecastResult)) return null

  return (
    <PanelSection printHide>
      <ForecastErrorBoundary fallbackMessage="Unable to display forecast media">
        <ForecastMedia media={forecastResult.media} />
      </ForecastErrorBoundary>
    </PanelSection>
  )
}

function WeatherPanelSection({ weather, zoneId, timezone }: ForecastPanelProps) {
  if (!weather) return null

  return (
    <PanelSection printSection="weather">
      <ForecastErrorBoundary fallbackMessage="Unable to display the weather summary">
        <WeatherSummary weather={weather} zoneId={zoneId} timezone={timezone} />
      </ForecastErrorBoundary>
    </PanelSection>
  )
}

/**
 * One ruled section of the panel. `empty:hidden` drops the rule and padding when its content
 * renders nothing (a weather product with nothing tabulable, say).
 */
function PanelSection({
  printSection,
  printHide,
  children,
}: {
  printSection?: PrintSection
  printHide?: boolean
  children: ReactNode
}) {
  return (
    <div
      data-print-section={printSection}
      data-print-hide={printHide || undefined}
      className="py-12 empty:hidden first:pt-0 last:pb-0"
    >
      {children}
    </div>
  )
}

/** Headed by the count, with each problem below, to match the widget. */
function AvalancheProblems({
  problems,
  elevationBandNames,
}: {
  problems: AvalancheProblem[]
  elevationBandNames: ElevationBandNames
}) {
  return (
    <section>
      <h2 className={cn(sectionHeading, 'mb-8')}>Avalanche Problems ({problems.length})</h2>
      {problems.map((problem) => (
        <ForecastErrorBoundary
          key={problem.id}
          fallbackMessage={`Unable to display avalanche problem: ${problem.name}`}
        >
          <AvalancheProblemCard problem={problem} elevationBandNames={elevationBandNames} />
        </ForecastErrorBoundary>
      ))}
    </section>
  )
}

/**
 * Forecast-level media, as a thumbnail grid opening the lightbox. The captions are
 * forecaster-authored HTML, so they are sanitized here on the server — anywhere downstream would
 * ship `sanitize-html` to every reader. Its own component so the work happens *inside* the
 * boundary: a caption that trips the sanitizer costs the media section, not the forecast.
 */
function ForecastMedia({ media }: { media: MediaItem[] }) {
  return (
    <section className="space-y-4">
      <h2 className={sectionHeading}>Media</h2>
      <ForecastMediaThumbnails media={toLightboxMediaList(media)} />
    </section>
  )
}
