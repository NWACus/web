/**
 * Native forecast page (current/live product): fetches the zone's current forecast,
 * any active warning, and the product archive (for the date picker), then hands off
 * to the shared NativeForecastView. The dated history route renders the same view with
 * a product fetched by id.
 */
import {
  buildZoneArchiveDates,
  initialArchiveWindow,
  validDateForProduct,
} from '@/services/nac/archiveDates'
import {
  fetchForecast,
  fetchProductArchive,
  fetchWarning,
  getAvalancheCenterMetadata,
} from '@/services/nac/nac'
import { resolveZoneFromSlug } from '@/services/nac/resolveZone'
import { type WarningResult } from '@/services/nac/types/forecastSchemas'

import { NativeForecastView } from './NativeForecastView'

interface NativeForecastPageProps {
  centerSlug: string
  zoneSlug: string
}

/** Narrow a WarningResult to a Warning/Watch/Special or null. */
function toWarningProduct(result: WarningResult | null) {
  if (!result) return null
  // NullWarning has avalanche_center: null
  if (result.avalanche_center === null) return null
  return result
}

export async function NativeForecastPage({ centerSlug, zoneSlug }: NativeForecastPageProps) {
  // Metadata gives us the center timezone for rendering issued/expires times and dates.
  const [zone, metadata] = await Promise.all([
    resolveZoneFromSlug(centerSlug, zoneSlug),
    getAvalancheCenterMetadata(centerSlug),
  ])

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

  // Anchor the picker window on the current product's date, not "today": off-season the
  // latest forecast can be months old (e.g. an April summary), and the calendar opens on
  // that month — so that's the window we must pre-load, or it renders empty until paged.
  const currentDate = validDateForProduct(forecastResult.published_time, metadata.timezone)
  const window = initialArchiveWindow(currentDate)
  const archive = await fetchProductArchive(centerSlug, window)
  const initialDates = buildZoneArchiveDates(archive, zone.zone.id, metadata.timezone)

  return (
    <NativeForecastView
      center={centerSlug}
      zone={zone}
      timezone={metadata.timezone}
      forecastResult={forecastResult}
      warning={toWarningProduct(warningResult)}
      initialDates={initialDates}
      initialRange={window}
      currentDate={currentDate}
      selectedDate={null}
      basePath={`/forecasts/avalanche/${zoneSlug}`}
    />
  )
}
