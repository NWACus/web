import { grantStationAccess } from '@/migrations/data/grantStationAccess'
import { seedStationPages } from '@/migrations/data/seedStationPages'
import config from '@payload-config'
import { getPayload } from 'payload'

/**
 * Seed the weather station pages for a local database.
 *
 * The migration that seeds these on a deployed environment is a no-op locally:
 * it runs before `/next/seed` has created any tenant, finds no `nwac`, and
 * returns. Locally the schema is pushed rather than migrated anyway, so this
 * script is the way to get the data. Run it after `pnpm seed`.
 *
 * Idempotent -- existing pages and assignments are left alone.
 */
const TENANT_SLUG = 'nwac'

const payload = await getPayload({ config })

const { docs: tenants } = await payload.find({
  collection: 'tenants',
  where: { slug: { equals: TENANT_SLUG } },
  limit: 1,
  depth: 0,
})
const tenant = tenants[0]
if (!tenant) {
  payload.logger.error(`No tenant with slug ${TENANT_SLUG}; run pnpm seed first`)
  process.exit(1)
}

const result = await seedStationPages(payload, tenant.id)
payload.logger.info(result, 'station pages seeded')
const granted = await grantStationAccess(payload)
payload.logger.info({ roles: granted }, 'Admin roles granted station access')
process.exit(0)
