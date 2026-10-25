/**
 * Native forecast page (current/live product): fetches the zone's current forecast,
 * any active warning, and the product archive (for the date picker), then hands off
 * to the shared NativeForecastView. The dated history route renders the same view with
 * a product fetched by id.
 */
import {
  buildZoneArchiveDates,
  forecastPickerSettings,
  initialArchiveWindow,
  validDateForProduct,
} from '@/services/nac/archiveDates'
import { elevationBandsUrl } from '@/services/nac/dangerScale'
import { forecastFreshnessEndpoint } from '@/services/nac/forecastFingerprint'
import type { ForecastResult } from '@/services/nac/model/forecast'
import { fetchProductArchive, getAvalancheCenterMetadata } from '@/services/nac/nac'
import { getNWACWeatherForForecast } from '@/services/nac/nwacWeatherForForecast'
import { resolveZoneFromSlug } from '@/services/nac/resolveZone'
import { getForecastSource, getWarningSource } from '@/services/nac/sources'
import { getWeatherForForecast } from '@/services/nac/weatherForForecast'
import { showsZoneObservationTabs } from '@/services/nac/zoneObservations'
import type { ComponentProps } from 'react'

import { RevalidateOnView } from '@/components/freshness/RevalidateOnView.client'
import { ForecastGlossary } from '@/components/glossary/ForecastGlossary'

import { ForecastUnavailable } from './ForecastUnavailable'
import { NativeForecastView } from './NativeForecastView'
import { ZoneTabs } from './zoneObservations/ZoneTabs.client'
import { forecastTabLabel, zoneObservationsEndpoint } from './zoneObservations/zoneTabs'

/**
 * Forecast-9: the zone's Observations and Avalanches tabs around the bottom line and panel, on
 * the live page only, as in the widget; undefined where the center has them off.
 */
async function zoneTabsFor(
  centerSlug: string,
  zoneSlug: string,
  zoneName: string,
  forecastResult: ForecastResult,
): Promise<ComponentProps<typeof NativeForecastView>['zoneTabs']> {
  if (!(await showsZoneObservationTabs(centerSlug))) return undefined

  return function renderZoneTabs({ bottomLine, panel }) {
    return (
      <ZoneTabs
        endpoint={zoneObservationsEndpoint(centerSlug, zoneSlug)}
        zoneName={zoneName}
        forecastLabel={forecastTabLabel(forecastResult.product_type)}
        bottomLine={bottomLine}
        panel={panel}
      />
    )
  }
}

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

  const [lookup, warning] = await Promise.all([
    getForecastSource(centerSlug).lookupForecast(centerSlug, zone.zone.id),
    getWarningSource(centerSlug).getWarning(centerSlug, zone.zone.id),
  ])

  // The address covers both safety-critical products on this page: an alert issued for this zone
  // is a change an open tab must hear about even when the forecast itself is untouched.
  const freshnessEndpoint = forecastFreshnessEndpoint(
    centerSlug,
    zoneSlug,
    lookup.status === 'found' ? lookup.product : null,
    warning,
  )

  if (lookup.status !== 'found') {
    return (
      <>
        <ForecastUnavailable reason={lookup.status} />
        {/* Keep asking even with nothing to show. A first publish into a zone that had none is the
            change an open tab most needs to hear about, and it is the one the (deferred) upstream
            publish notification would miss. */}
        <RevalidateOnView endpoints={[freshnessEndpoint]} />
      </>
    )
  }

  const forecastResult = lookup.product

  // Anchor the picker window on the current product's date, not "today": off-season the
  // latest forecast can be months old (e.g. an April summary), and the calendar opens on
  // that month — so that's the window we must pre-load, or it renders empty until paged.
  const currentDate = validDateForProduct(forecastResult.published_time, metadata.timezone)
  const window = initialArchiveWindow(currentDate)

  // The mountain-weather product is issued separately; `getWeatherForForecast` owns how it is found,
  // and NWAC's own weather is found by time instead.
  const [archive, weather, nwacWeather] = await Promise.all([
    fetchProductArchive(centerSlug, window),
    getWeatherForForecast(centerSlug, zone.zone.id, forecastResult, metadata.timezone),
    // A failed read is already logged, and only costs the weather: the forecast still shows.
    getNWACWeatherForForecast(
      centerSlug,
      zone.zone.id,
      forecastResult.published_time,
      metadata.timezone,
    ).catch(() => null),
  ])
  const initialDates = buildZoneArchiveDates(archive, zone.zone.id, metadata.timezone)

  const zoneTabs = await zoneTabsFor(centerSlug, zoneSlug, zone.zone.name, forecastResult)

  return (
    <>
      <ForecastGlossary center={metadata}>
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
          pickerSettings={forecastPickerSettings(metadata)}
          centerDetails={{ type: metadata.type, elevationBandsUrl: elevationBandsUrl(metadata) }}
          weather={weather}
          nwacWeather={nwacWeather}
          zoneTabs={zoneTabs}
        />
      </ForecastGlossary>
      {/* Revalidate-on-view: catches a correction/retraction published after this (ISR) page was
          rendered and refreshes the viewer's page. Live route only — the dated archive is immutable. */}
      <RevalidateOnView endpoints={[freshnessEndpoint]} />
    </>
  )
}
