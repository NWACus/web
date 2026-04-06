/**
 * Native forecast page composition: assembles all forecast components
 * into a single server-rendered page.
 */
import { fetchForecast, fetchWarning } from '@/services/nac/nac'
import { resolveZoneFromSlug } from '@/services/nac/resolveZone'
import {
  DangerLevel,
  ForecastPeriod,
  ProductType,
  type Forecast,
  type WarningResult,
} from '@/services/nac/types/forecastSchemas'

import { AvalancheProblemCard } from './AvalancheProblemCard'
import { BottomLine } from './BottomLine'
import { DangerRating } from './DangerRating'
import { ForecastDiscussion } from './ForecastDiscussion'
import { ForecastErrorBoundary } from './ForecastErrorBoundary'
import { ForecastHeader } from './ForecastHeader'
import { ForecastMediaThumbnails } from './ForecastMediaThumbnails'
import { WarningBanner } from './WarningBanner'

interface NativeForecastPageProps {
  centerSlug: string
  zoneSlug: string
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

/** Narrow a WarningResult to a Warning/Watch/Special or null. */
function toWarningProduct(result: WarningResult | null) {
  if (!result) return null
  // NullWarning has avalanche_center: null
  if (result.avalanche_center === null) return null
  return result
}

export async function NativeForecastPage({ centerSlug, zoneSlug }: NativeForecastPageProps) {
  const zone = await resolveZoneFromSlug(centerSlug, zoneSlug)

  if (!zone) {
    return <div className="container py-8 text-center text-muted-foreground">Zone not found.</div>
  }

  const [forecastResult, warningResult] = await Promise.all([
    fetchForecast(centerSlug, zone.zone.id),
    fetchWarning(centerSlug, zone.zone.id),
  ])

  if (!forecastResult) {
    return (
      <div className="container py-8 text-center text-muted-foreground">
        Unable to load forecast data. Please try again later.
      </div>
    )
  }

  const warning = toWarningProduct(warningResult)
  const isForecast = forecastResult.product_type === ProductType.Forecast

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6">
      {/* Warning banner */}
      <ForecastErrorBoundary fallbackMessage="Unable to display warning information">
        <WarningBanner warning={warning} />
      </ForecastErrorBoundary>

      {/* Header: author, published, expires */}
      <ForecastErrorBoundary fallbackMessage="Unable to display forecast metadata">
        <ForecastHeader forecast={forecastResult} />
      </ForecastErrorBoundary>

      {/* Danger rating — only for full forecasts (not summary products) */}
      {isForecast && (
        <ForecastErrorBoundary fallbackMessage="Unable to display danger rating">
          <DangerRating
            danger={forecastResult.danger}
            elevationBandNames={zone.zone.config.elevation_band_names}
          />
        </ForecastErrorBoundary>
      )}

      {/* Bottom line */}
      {forecastResult.bottom_line && (
        <ForecastErrorBoundary fallbackMessage="Unable to display the bottom line">
          <BottomLine
            html={forecastResult.bottom_line}
            dangerLevel={isForecast ? highestDangerLevel(forecastResult) : DangerLevel.None}
          />
        </ForecastErrorBoundary>
      )}

      {/* Avalanche problems — only for full forecasts */}
      {isForecast &&
        forecastResult.forecast_avalanche_problems.map((problem) => (
          <ForecastErrorBoundary
            key={problem.id}
            fallbackMessage={`Unable to display avalanche problem: ${problem.name}`}
          >
            <AvalancheProblemCard problem={problem} />
          </ForecastErrorBoundary>
        ))}

      {/* Forecast discussion */}
      {forecastResult.hazard_discussion && (
        <ForecastErrorBoundary fallbackMessage="Unable to display forecast discussion">
          <ForecastDiscussion html={forecastResult.hazard_discussion} />
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
