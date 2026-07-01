/**
 * All-zones forecast grid: fetches and renders compact forecast cards
 * for every active zone in a center, in parallel.
 */
import { getActiveForecastZones, getAvalancheCenterMetadata } from '@/services/nac/nac'
import { getForecastSource, getWarningSource } from '@/services/nac/sources'

import { ForecastErrorBoundary } from './ForecastErrorBoundary'
import { ZoneForecastCard } from './ZoneForecastCard'

interface AllZonesForecastProps {
  centerSlug: string
}

export async function AllZonesForecast({ centerSlug }: AllZonesForecastProps) {
  // Metadata gives us the center timezone for rendering issued/expires times.
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

  // Fetch all forecasts and warnings in parallel, through the per-product source adapter.
  const forecastSource = getForecastSource(centerSlug)
  const warningSource = getWarningSource(centerSlug)
  const results = await Promise.all(
    zones.map(async ({ slug, zone }) => {
      const [forecast, warning] = await Promise.all([
        forecastSource.getForecast(centerSlug, zone.id),
        warningSource.getWarning(centerSlug, zone.id),
      ])
      return { slug, zone, forecast, warning }
    }),
  )

  return (
    <div className="container space-y-6 py-6">
      {results.map(({ slug, zone, forecast, warning }) => (
        <ForecastErrorBoundary
          key={zone.id}
          fallbackMessage={`Unable to display forecast for ${zone.name}`}
        >
          <ZoneForecastCard
            zoneName={zone.name}
            zoneSlug={slug}
            forecast={forecast}
            warning={warning}
            elevationBandNames={zone.config.elevation_band_names}
            timezone={metadata.timezone}
          />
        </ForecastErrorBoundary>
      ))}
    </div>
  )
}
