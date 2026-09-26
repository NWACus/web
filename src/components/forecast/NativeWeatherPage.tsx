/**
 * Native Mountain Weather page (current product): fetches the center's current mountain-weather
 * product and hands off to NativeWeatherView. The product is fetched through the center's first
 * active zone, as the legacy widget did — one weather product covers every zone.
 */
import Link from 'next/link'

import { weatherFreshnessEndpoint } from '@/services/nac/forecastFingerprint'
import { getActiveForecastZones, getAvalancheCenterMetadata } from '@/services/nac/nac'
import { getWeatherSource } from '@/services/nac/sources'

import { RevalidateOnView } from '@/components/freshness/RevalidateOnView.client'
import { ForecastGlossary } from '@/components/glossary/ForecastGlossary'

import { NativeWeatherView } from './NativeWeatherView'

interface NativeWeatherPageProps {
  centerSlug: string
}

export async function NativeWeatherPage({ centerSlug }: NativeWeatherPageProps) {
  // Metadata gives us the center timezone for the issued time, and the zone order for the tables.
  const [zones, metadata] = await Promise.all([
    getActiveForecastZones(centerSlug),
    getAvalancheCenterMetadata(centerSlug),
  ])

  if (zones.length === 0) {
    return (
      <div className="container py-8 text-center text-muted-foreground">
        No active forecast zones found.
      </div>
    )
  }

  const weather = await getWeatherSource(centerSlug).getCurrentWeather(centerSlug, zones[0].zone.id)

  // Asked about even with nothing to show: a first publish into a center that had none is the
  // change an open tab most needs to hear about.
  const freshnessEndpoint = weatherFreshnessEndpoint(centerSlug, weather)

  if (!weather) {
    return (
      <>
        <div className="container space-y-4 py-8 text-center text-muted-foreground">
          <p>There is no current Mountain Weather product to display, or it could not be loaded.</p>
          <p>
            View the{' '}
            <Link href="/forecasts/avalanche" className="underline">
              current Avalanche Forecast
            </Link>
            .
          </p>
        </div>
        <RevalidateOnView endpoints={[freshnessEndpoint]} />
      </>
    )
  }

  return (
    <>
      <ForecastGlossary center={metadata}>
        <NativeWeatherView
          weather={weather}
          zones={metadata.zones}
          timezone={metadata.timezone}
          centerType={metadata.type}
        />
      </ForecastGlossary>
      {/* Revalidate-on-view: catches a product corrected or re-issued after this (ISR) page was
          rendered and refreshes the viewer's page. */}
      <RevalidateOnView endpoints={[freshnessEndpoint]} />
    </>
  )
}
