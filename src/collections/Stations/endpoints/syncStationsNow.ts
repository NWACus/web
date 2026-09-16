import { byTenantRole } from '@/access/byTenantRole'
import { syncIsDue, syncStationsForTenant } from '@/services/snowobs/syncStations'
import { stationPagesTag } from '@/services/stations/revalidate'
import { getTenantSlugFromCookie } from '@/utilities/tenancy/getTenantFromCookie'
import { revalidateTag } from 'next/cache'
import type { PayloadHandler } from 'payload'

/**
 * Pull the current station list from SnowObs for the center the admin is
 * looking at. The only way rows get here. The Stations list calls it with
 * `?ifStale` when it opens, which is a no-op inside SYNC_STALE_AFTER_HOURS of
 * the last run; the button calls it without, to force one.
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

  const url = new URL(req.url ?? '', 'http://localhost')
  if (url.searchParams.has('ifStale')) {
    const { docs: newest } = await payload.find({
      collection: 'stations',
      where: { tenant: { equals: tenant.id } },
      sort: '-lastSyncedAt',
      limit: 1,
      depth: 0,
      select: { lastSyncedAt: true },
    })
    const lastSyncedAt = newest[0]?.lastSyncedAt
    if (!syncIsDue(lastSyncedAt)) {
      return Response.json({ skipped: true, lastSyncedAt })
    }
  }

  try {
    const result = await syncStationsForTenant(payload, { id: tenant.id, slug: tenant.slug })
    // Rows are written with revalidation off; one bust per run covers them all.
    if (result.created + result.updated > 0) revalidateTag(stationPagesTag(tenant.slug))
    return Response.json(result)
  } catch (error) {
    payload.logger.error({ err: error, tenant: slug }, 'station sync failed')
    return Response.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 502 },
    )
  }
}
