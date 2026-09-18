import { resolveSnowObsAccess } from '@/services/snowobs/access'
import {
  fetchCatalogue,
  fetchCurrentObservations,
  fetchTrackedStations,
  withCurrentObservations,
  withUntracked,
} from '@/services/snowobs/stationTracking'
import { isValidTenantSlug } from '@/utilities/tenancy/avalancheCenters'
import type { PayloadHandler } from 'payload'

/**
 * The stations a center tracks in SnowObs, each with the variables and time of
 * its latest observation, followed by the untracked loggers from the center's
 * own catalogue, for the picker on a station page. A proxy so the admin never
 * handles the token, cached an hour server-side.
 * The token is public (it sits in the center's AFP config), so any signed-in
 * admin may read any center's list.
 */
export const trackedStations: PayloadHandler = async (req) => {
  if (!req.user) {
    return Response.json({ error: 'Authentication required' }, { status: 401 })
  }
  const center = req.url ? new URL(req.url).searchParams.get('center') : null
  if (!center || !isValidTenantSlug(center)) {
    return Response.json({ error: 'center must be a known avalanche center' }, { status: 400 })
  }
  try {
    const { token, ownSources } = await resolveSnowObsAccess(center)
    const [tracked, current, ...catalogues] = await Promise.all([
      fetchTrackedStations(token),
      fetchCurrentObservations(token),
      ...ownSources.map((source) => fetchCatalogue(token, source)),
    ])
    const stations = withUntracked(withCurrentObservations(tracked, current), catalogues.flat())
    return Response.json({ stations })
  } catch (error) {
    req.payload.logger.error({ err: error, center }, 'tracked stations lookup failed')
    return Response.json(
      { error: error instanceof Error ? error.message : 'SnowObs lookup failed' },
      { status: 502 },
    )
  }
}
