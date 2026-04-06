/**
 * All-zones forecast grid: fetches and renders compact forecast cards
 * for every active zone in a center, in parallel.
 */
import { fetchForecast, fetchWarning, getActiveForecastZones } from '@/services/nac/nac'

import { ForecastErrorBoundary } from './ForecastErrorBoundary'
import { ZoneForecastCard } from './ZoneForecastCard'

interface AllZonesForecastProps {
  centerSlug: string
}

export async function AllZonesForecast({ centerSlug }: AllZonesForecastProps) {
  const zones = await getActiveForecastZones(centerSlug)

  if (zones.length === 0) {
    return (
      <div className="container py-8 text-center text-muted-foreground">
        No active forecast zones found.
      </div>
    )
  }

  // Fetch all forecasts and warnings in parallel
  const results = await Promise.all(
    zones.map(async ({ slug, zone }) => {
      const [forecast, warning] = await Promise.all([
        fetchForecast(centerSlug, zone.id),
        fetchWarning(centerSlug, zone.id),
      ])
      return { slug, zone, forecast, warning }
    }),
  )

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6">
      {results.map(({ slug, zone, forecast, warning }) => (
        <ForecastErrorBoundary
          key={zone.id}
          fallbackMessage={`Unable to display forecast for ${zone.name}`}
        >
          <ZoneForecastCard
            zoneName={zone.name}
            zoneSlug={slug}
            centerSlug={centerSlug}
            forecast={forecast}
            warning={warning}
            elevationBandNames={zone.config.elevation_band_names}
          />
        </ForecastErrorBoundary>
      ))}
    </div>
  )
}
