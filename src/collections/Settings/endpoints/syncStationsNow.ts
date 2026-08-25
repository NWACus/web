import { syncStations } from '@/services/snowobs/syncStations'
import type { PayloadHandler } from 'payload'

/**
 * Run the station sync for one center on demand.
 *
 * The hourly cron is the normal path; this is for the moment after someone
 * pastes a token in and wants to know whether it works, without waiting an hour
 * to find out. Same code, so a green result here means the cron will be green
 * too.
 */
export const syncStationsNow: PayloadHandler = async (req) => {
  const { payload, user, routeParams } = req

  if (!user) {
    return Response.json({ error: 'Authentication required' }, { status: 401 })
  }

  const id = routeParams?.id
  if (typeof id !== 'string' && typeof id !== 'number') {
    return Response.json({ error: 'Settings id is required' }, { status: 400 })
  }

  // Enforce document access as the caller, so a center's staff cannot sync
  // another center's stations by guessing an id.
  try {
    await payload.findByID({ collection: 'settings', id, user, overrideAccess: false, depth: 0 })
  } catch {
    return Response.json({ error: 'Not allowed' }, { status: 403 })
  }

  // Re-read with access overridden: the token is deliberately unreadable to
  // most roles, and the sync needs it.
  const settings = await payload.findByID({ collection: 'settings', id, depth: 1 })
  const tenant = typeof settings.tenant === 'object' ? settings.tenant : null
  const snowobs = settings.snowobs

  if (!tenant || !snowobs?.source || !snowobs?.token) {
    return Response.json(
      { error: 'Add a SnowObs source and token before syncing.' },
      { status: 400 },
    )
  }

  try {
    const result = await syncStations(payload, {
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      source: snowobs.source,
      token: snowobs.token,
    })
    return Response.json(result)
  } catch (error) {
    payload.logger.error({ err: error, tenant: tenant.slug }, 'manual station sync failed')
    return Response.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 502 },
    )
  }
}
