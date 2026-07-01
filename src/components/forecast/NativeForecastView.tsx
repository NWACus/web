/**
 * Presentational composition for a single forecast/summary product. Shared by the
 * live forecast page (current product) and the dated history route (a product fetched
 * by id), so both render identically. Pure presentation: it receives already-fetched
 * data and renders — no data fetching here.
 */
import type { ZoneArchiveDate } from '@/services/nac/archiveDates'
import {
  DangerLevel,
  ForecastPeriod,
  ProductType,
  type Forecast,
  type ForecastResult,
  type WarningProduct,
  type Weather,
} from '@/services/nac/model/forecast'
import type { ActiveForecastZoneWithSlug } from '@/services/nac/nac'

import { AvalancheProblemCard } from './AvalancheProblemCard'
import { BottomLine } from './BottomLine'
import { DangerRating } from './DangerRating'
import { ForecastDatePicker } from './ForecastDatePicker.client'
import { ForecastDiscussion } from './ForecastDiscussion'
import { ForecastErrorBoundary } from './ForecastErrorBoundary'
import { ForecastHeader } from './ForecastHeader'
import { ForecastMediaThumbnails } from './ForecastMediaThumbnails'
import { ValidityBanner } from './ValidityBanner'
import { WarningBanner } from './WarningBanner'
import { WeatherSummary } from './WeatherSummary'

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
  /** The separately-issued weather product, when one is available (live page only). */
  weather?: Weather | null
}

/** All danger levels ordered low to high for safe lookup by numeric value. */
const dangerLevels: DangerLevel[] = [
  DangerLevel.None,
  DangerLevel.Low,
  DangerLevel.Moderate,
  DangerLevel.Considerable,
  DangerLevel.High,
  DangerLevel.Extreme,
]

/** Extract the highest danger level from a forecast's current-day danger array. */
function highestDangerLevel(forecast: Forecast): DangerLevel {
  const today = forecast.danger.find((d) => d.valid_day === ForecastPeriod.Current)
  if (!today) return DangerLevel.None
  const max = Math.max(today.upper, today.middle, today.lower)
  return dangerLevels[max] ?? DangerLevel.None
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
  weather,
}: NativeForecastViewProps) {
  const isForecast = forecastResult.product_type === ProductType.Forecast

  return (
    <div className="container space-y-6 py-6">
      {/* Page header: zone name. The "Avalanche Forecast" subtitle is only shown for
          forecast products; summary products carry their own title in the discussion
          (e.g. NWAC's "Spring Statement"), so we don't impose a label. */}
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{zone.zone.name}</h1>
        {isForecast && <p className="text-muted-foreground">Avalanche Forecast</p>}
      </header>

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
        <WarningBanner warning={warning} />
      </ForecastErrorBoundary>

      {/* Validity-date banner: archived on a dated view, expired on the live view */}
      <ForecastErrorBoundary fallbackMessage="Unable to display forecast validity">
        <ValidityBanner forecast={forecastResult} selectedDate={selectedDate} basePath={basePath} />
      </ForecastErrorBoundary>

      {/* Header: author, issued, expires */}
      <ForecastErrorBoundary fallbackMessage="Unable to display forecast metadata">
        <ForecastHeader forecast={forecastResult} timezone={timezone} />
      </ForecastErrorBoundary>

      {/* Bottom line — rendered above the danger rating to match the legacy afp widget,
          which leads with the forecaster's bottom line before the per-band ratings. */}
      {forecastResult.bottom_line && (
        <ForecastErrorBoundary fallbackMessage="Unable to display the bottom line">
          <BottomLine
            html={forecastResult.bottom_line}
            dangerLevel={isForecast ? highestDangerLevel(forecastResult) : DangerLevel.None}
          />
        </ForecastErrorBoundary>
      )}

      {/* Danger rating — only for full forecasts (not summary products) */}
      {isForecast && (
        <ForecastErrorBoundary fallbackMessage="Unable to display danger rating">
          <DangerRating
            danger={forecastResult.danger}
            elevationBandNames={zone.zone.config.elevation_band_names}
            publishedTime={forecastResult.published_time}
            timezone={timezone}
          />
        </ForecastErrorBoundary>
      )}

      {/* Avalanche problems — only for full forecasts, headed by the count to match the widget */}
      {isForecast && forecastResult.forecast_avalanche_problems.length > 0 && (
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
      )}

      {/* Forecast discussion */}
      {forecastResult.hazard_discussion && (
        <ForecastErrorBoundary fallbackMessage="Unable to display forecast discussion">
          <ForecastDiscussion html={forecastResult.hazard_discussion} />
        </ForecastErrorBoundary>
      )}

      {/* Weather summary — the separately-issued mountain-weather product, inline (live page only) */}
      {weather && (
        <ForecastErrorBoundary fallbackMessage="Unable to display the weather summary">
          <WeatherSummary weather={weather} zoneName={zone.zone.name} timezone={timezone} />
        </ForecastErrorBoundary>
      )}

      {/* Forecast-level media */}
      {forecastResult.media && forecastResult.media.length > 0 && (
        <ForecastErrorBoundary fallbackMessage="Unable to display forecast media">
          <ForecastMediaThumbnails media={forecastResult.media} />
        </ForecastErrorBoundary>
      )}
    </div>
  )
}
