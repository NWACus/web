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
import { fetchProductArchive, getAvalancheCenterMetadata } from '@/services/nac/nac'
import { resolveZoneFromSlug } from '@/services/nac/resolveZone'
import { getForecastSource, getWarningSource } from '@/services/nac/sources'

import { NativeForecastView } from './NativeForecastView'

interface NativeForecastPageProps {
  centerSlug: string
  zoneSlug: string
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

  const [forecastResult, warning] = await Promise.all([
    getForecastSource(centerSlug).getForecast(centerSlug, zone.zone.id),
    getWarningSource(centerSlug).getWarning(centerSlug, zone.zone.id),
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
      warning={warning}
      initialDates={initialDates}
      initialRange={window}
      currentDate={currentDate}
      selectedDate={null}
      basePath={`/forecasts/avalanche/${zoneSlug}`}
    />
  )
}
