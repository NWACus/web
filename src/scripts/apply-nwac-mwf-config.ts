// One-off: apply the real NWAC MWF config (zones, points, model sources) to
// an existing dev database without reseeding. Safe to re-run.
//
//   ENABLE_LOCAL_MIGRATIONS=true pnpm payload run ./src/scripts/apply-nwac-mwf-config.ts
import { NWAC_MWF_CONFIG } from '@/endpoints/seed/nwacMwfConfig'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

const payload = await getPayload({ config: configPromise })
const tenants = await payload.find({
  collection: 'tenants',
  where: { slug: { equals: 'nwac' } },
  limit: 1,
  depth: 0,
})
const tenant = tenants.docs[0]
if (!tenant) throw new Error('nwac tenant not found — seed the database first')
const settings = await payload.find({
  collection: 'settings',
  where: { tenant: { equals: tenant.id } },
  limit: 1,
  depth: 0,
})
const setting = settings.docs[0]
if (!setting) throw new Error('nwac settings not found — seed the database first')

await payload.update({
  collection: 'settings',
  id: setting.id,
  data: { nativeProducts: { mwf: true }, mwf: NWAC_MWF_CONFIG },
  context: { disableRevalidate: true },
})
payload.logger.info(
  {
    settings: setting.id,
    models: NWAC_MWF_CONFIG.models?.length,
    points: NWAC_MWF_CONFIG.points?.length,
  },
  'applied NWAC MWF config',
)
process.exit(0)
