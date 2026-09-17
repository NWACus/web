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
import { forecastFreshnessEndpoint } from '@/services/nac/forecastFingerprint'
import { fetchProductArchive, getAvalancheCenterMetadata } from '@/services/nac/nac'
import { resolveZoneFromSlug } from '@/services/nac/resolveZone'
import { getForecastSource, getWarningSource } from '@/services/nac/sources'
import { getWeatherForForecast } from '@/services/nac/weatherForForecast'

import { RevalidateOnView } from '@/components/freshness/RevalidateOnView.client'

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

  // The address covers both safety-critical products on this page: an alert issued for this zone
  // is a change an open tab must hear about even when the forecast itself is untouched.
  const freshnessEndpoint = forecastFreshnessEndpoint(centerSlug, zoneSlug, forecastResult, warning)

  if (!forecastResult) {
    return (
      <>
        <div className="container py-8 text-center text-muted-foreground">
          Unable to load forecast data. Please try again later.
        </div>
        {/* Keep asking even with nothing to show. A first publish into a zone that had none is the
            change an open tab most needs to hear about, and it is the one the (deferred) upstream
            publish notification would miss. */}
        <RevalidateOnView endpoints={[freshnessEndpoint]} />
      </>
    )
  }

  // Anchor the picker window on the current product's date, not "today": off-season the
  // latest forecast can be months old (e.g. an April summary), and the calendar opens on
  // that month — so that's the window we must pre-load, or it renders empty until paged.
  const currentDate = validDateForProduct(forecastResult.published_time, metadata.timezone)
  const window = initialArchiveWindow(currentDate)

  // The mountain-weather product is issued separately; `getWeatherForForecast` owns how it is found.
  const [archive, weather] = await Promise.all([
    fetchProductArchive(centerSlug, window),
    getWeatherForForecast(centerSlug, zone.zone.id, forecastResult, metadata.timezone),
  ])
  const initialDates = buildZoneArchiveDates(archive, zone.zone.id, metadata.timezone)

  return (
    <>
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
        centerType={metadata.type}
        weather={weather}
      />
      {/* Revalidate-on-view: catches a correction/retraction published after this (ISR) page was
          rendered and refreshes the viewer's page. Live route only — the dated archive is immutable. */}
      <RevalidateOnView endpoints={[freshnessEndpoint]} />
    </>
  )
}
