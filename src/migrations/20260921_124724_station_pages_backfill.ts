import { grantStationAccess, seedStationPages } from '@/services/stations/seedStationPages'
import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-sqlite'

const TENANT_SLUG = 'nwac'

/**
 * NWAC's 32 station pages, as ported from the legacy site, and station-page
 * access for every center's Admin role. Idempotent: a page that exists is
 * left alone, a role that already has the collection is not touched.
 * Locally the seed script does the pages instead, because this runs before
 * any tenant exists.
 */
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const { docs: tenants } = await payload.find({
    collection: 'tenants',
    where: { slug: { equals: TENANT_SLUG } },
    limit: 1,
    depth: 0,
    req,
  })
  const tenant = tenants[0]
  if (tenant) {
    const seeded = await seedStationPages(payload, tenant.id, undefined, req)
    payload.logger.info(seeded, 'station pages seeded')
  } else {
    payload.logger.info(`No ${TENANT_SLUG} tenant; station pages not seeded`)
  }
  const granted = await grantStationAccess(payload, req)
  payload.logger.info({ roles: granted }, 'Admin roles granted station page access')
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  // No-op: the pages are content now, and the schema rollback in the prior
  // migration drops the table with them.
  payload.logger.info('No rollback for station-pages backfill')
}
