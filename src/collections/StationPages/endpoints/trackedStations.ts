import { resolveSnowObsToken } from '@/services/snowobs/access'
import {
  fetchCurrentVariables,
  fetchTrackedStations,
  withCurrentVariables,
} from '@/services/snowobs/stationTracking'
import { isValidTenantSlug } from '@/utilities/tenancy/avalancheCenters'
import type { PayloadHandler } from 'payload'

/**
 * The stations a center tracks in SnowObs, each with the variables its latest
 * observation reports, for the picker on a station page. A proxy so the admin
 * never handles the token, cached an hour server-side.
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
    const token = await resolveSnowObsToken(center)
    const [tracked, current] = await Promise.all([
      fetchTrackedStations(token),
      fetchCurrentVariables(token),
    ])
    return Response.json({ stations: withCurrentVariables(tracked, current) })
  } catch (error) {
    req.payload.logger.error({ err: error, center }, 'tracked stations lookup failed')
    return Response.json(
      { error: error instanceof Error ? error.message : 'SnowObs lookup failed' },
      { status: 502 },
    )
  }
}
