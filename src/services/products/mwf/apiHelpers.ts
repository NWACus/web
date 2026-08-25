// Shared plumbing for the MWF read APIs: tenant + flag resolution. Every MWF
// API 404s while the center's flag is off — the feature's existence leaks
// nowhere.
import configPromise from '@payload-config'
import { getPayload, type Payload } from 'payload'

export interface MwfApiContext {
  payload: Payload
  tenantId: number
  mwfZones: Array<{ code: string; name: string; nacZoneIds?: string | null }>
}

export async function resolveMwfApiContext(centerSlug: string): Promise<MwfApiContext | null> {
  const payload = await getPayload({ config: configPromise })
  const tenants = await payload.find({
    collection: 'tenants',
    where: { slug: { equals: centerSlug } },
    limit: 1,
    depth: 0,
  })
  const tenant = tenants.docs[0]
  if (!tenant) return null
  const settings = await payload.find({
    collection: 'settings',
    where: { tenant: { equals: tenant.id } },
    limit: 1,
    depth: 0,
  })
  const setting = settings.docs[0]
  if (!setting?.nativeProducts?.mwf) return null
  return {
    payload,
    tenantId: tenant.id,
    mwfZones: (setting.mwf?.zones ?? []).map((z) => ({
      code: z.code,
      name: z.name,
      nacZoneIds: z.nacZoneIds,
    })),
  }
}
