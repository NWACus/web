/**
 * All-zones forecast grid: fetches and renders compact forecast cards
 * for every active zone in a center, in parallel.
 */
import { elevationBandsUrl } from '@/services/nac/dangerScale'
import { forecastFreshnessEndpoint } from '@/services/nac/forecastFingerprint'
import { getActiveForecastZones, getAvalancheCenterMetadata } from '@/services/nac/nac'
import { allZonesTitle } from '@/services/nac/productTypeTitle'
import { getForecastSource, getWarningSource } from '@/services/nac/sources'

import { RevalidateOnView } from '@/components/freshness/RevalidateOnView.client'
import { ForecastGlossary } from '@/components/glossary/ForecastGlossary'

import { ForecastDisclaimer } from './ForecastDisclaimer'
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

  // Every card is a live danger rating, so this page needs the same open-tab guarantee the
  // individual forecast pages have. It asks the very same per-zone addresses they do — one card's
  // (forecast, warning) pair is exactly one zone page's — so the grid shares their edge cache
  // entries and adds no origin traffic of its own, and their purges invalidate this page's route
  // cache through the same tags. Asked as one set, so a daily publish across every zone is a
  // single refresh rather than one per card.
  const freshnessEndpoints = results.map(({ slug, forecast, warning }) =>
    forecastFreshnessEndpoint(centerSlug, slug, forecast, warning),
  )

  const title = allZonesTitle(results.flatMap(({ forecast }) => forecast?.product_type ?? []))

  // Each card's bottom line is marked, as the widget's all-zones view did.
  return (
    <ForecastGlossary center={metadata}>
      <div className="container py-6">
        {title && <h1 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>}
        <div className="space-y-16">
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
                elevationBandsUrl={elevationBandsUrl(metadata)}
                timezone={metadata.timezone}
              />
            </ForecastErrorBoundary>
          ))}
        </div>
        {/* No single product to name the provider, so it comes from the center, as in the widget. */}
        <ForecastDisclaimer centerType={metadata.type} centerName={metadata.name} />
        <RevalidateOnView endpoints={freshnessEndpoints} />
      </div>
    </ForecastGlossary>
  )
}
