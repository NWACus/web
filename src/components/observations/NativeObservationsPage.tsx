/**
 * The server half of the native observation viewer, for `/observations`,
 * `/observations/avalanches` and `/observations/charts`: the heading, the disclaimer, and the
 * center's viewer settings and zones. The observations themselves are fetched by the viewer in the browser, because the list
 * follows the map (see `ObservationViewer.client.tsx`).
 */
import { ButtonLink } from '@/components/ButtonLink'
import ObservationsDisclaimer from '@/components/ObservationsDisclaimer'
import { getZoneMapLayer } from '@/services/nac/dangerMap/mapLayer'
import type { ObservationZoneOption } from '@/services/nac/model/observation'
import { getAvalancheCenterMetadata, logNacError } from '@/services/nac/nac'
import type { ViewerTab } from '@/services/nac/observations/routes'
import { resolveObservationViewerSettings } from '@/services/nac/observations/viewerSettings'
import { getObservationSource } from '@/services/nac/sources'
import { boundsOfGeometries } from '@/utilities/geo/bounds'

import { LegacyHashRedirect } from './LegacyHashRedirect.client'
import { ObservationViewerLoader } from './ObservationViewerLoader.client'

/**
 * The zone filter's options. The obs API's combined zones are the ones its records are tagged
 * with; if they can't be had, the center's forecast zones from the map layer carry the same ids,
 * so the filter still works — only the observation-only "Other Regions" are missing, as they are
 * from the widget in the same failure.
 */
async function loadZones(center: string): Promise<ObservationZoneOption[]> {
  try {
    return await getObservationSource().getZones(center)
  } catch (error) {
    await logNacError(error, 'Observation zones unavailable; falling back to forecast zones')
  }
  try {
    const layer = await getZoneMapLayer(center)
    return layer.features.flatMap((feature): ObservationZoneOption[] =>
      feature.id === null
        ? []
        : [
            {
              id: String(feature.id),
              name: feature.properties.name,
              type: 'forecast',
              centerIds: [feature.properties.center_id],
              priority: 1,
              bounds: feature.geometry ? boundsOfGeometries([feature.geometry]) : null,
            },
          ],
    )
  } catch {
    return []
  }
}

export async function NativeObservationsPage({ center, tab }: { center: string; tab: ViewerTab }) {
  const [metadata, zones] = await Promise.all([
    getAvalancheCenterMetadata(center),
    loadZones(center),
  ])
  const settings = resolveObservationViewerSettings(metadata, zones)

  return (
    <div className="container flex flex-col gap-4 pb-8">
      <LegacyHashRedirect />
      <div className="flex flex-col items-start justify-between gap-1 sm:flex-row sm:items-center sm:gap-4">
        <h1 className="text-3xl font-bold sm:text-4xl">Observations</h1>
        <ButtonLink href="/observations/submit" variant="secondary">
          Submit Observation
        </ButtonLink>
      </div>
      <ObservationsDisclaimer />
      <ObservationViewerLoader centerSlug={center} settings={settings} initialTab={tab} />
    </div>
  )
}
