import { byTenantRole } from '@/access/byTenantRole'
import { syncStationsForTenant } from '@/services/snowobs/syncStations'
import { getTenantSlugFromCookie } from '@/utilities/tenancy/getTenantFromCookie'
import type { PayloadHandler } from 'payload'

/**
 * Pull the current station list from SnowObs for the center the admin is
 * looking at. The only way rows get here: there is no scheduled sync, because
 * stations change a few times a decade and a button is easier to reason about
 * than a cron nobody watches.
 */
export const syncStationsNow: PayloadHandler = async (req) => {
  const { payload, user, headers } = req

  if (!user) {
    return Response.json({ error: 'Authentication required' }, { status: 401 })
  }

  const slug = getTenantSlugFromCookie(headers)
  if (!slug) {
    return Response.json({ error: 'Select a center first.' }, { status: 400 })
  }

  // Same rule as editing a station row: the cookie narrows the access check to
  // the selected center, so it comes back as a plain yes or no.
  const allowed = await byTenantRole('update', 'stations')({ req })
  if (!allowed) {
    return Response.json({ error: 'Not allowed' }, { status: 403 })
  }

  const { docs } = await payload.find({
    collection: 'tenants',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })
  const tenant = docs[0]
  if (!tenant) {
    return Response.json({ error: `No center named ${slug}` }, { status: 404 })
  }

  try {
    const result = await syncStationsForTenant(payload, { id: tenant.id, slug: tenant.slug })
    return Response.json(result)
  } catch (error) {
    payload.logger.error({ err: error, tenant: slug }, 'station sync failed')
    return Response.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 502 },
    )
  }
}
