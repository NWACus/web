import type { Tenant } from '@/payload-types'
import configPromise from '@payload-config'
import { revalidateTag } from 'next/cache'
import { getPayload, type Where } from 'payload'
import { centerSettingsTag } from './centerSettingsTag'
import { isValidRelationship } from './relationships'
import { resolveTenant } from './tenancy/resolveTenant'

// Settings fields getCenterSettings populates, by the collection they point at
const SETTINGS_REFERENCE_FIELDS: Record<string, string[]> = {
  media: ['logo', 'icon', 'banner', 'usfsLogo'],
  forms: ['footerForm.form.value'],
  pages: ['terms', 'privacy'],
}

/** Clear the cached settings of every center whose header, footer or icon uses the document. */
export async function revalidateSettingsReferencing(collection: string, id: number) {
  const fields = SETTINGS_REFERENCE_FIELDS[collection]
  if (!fields) return

  const payload = await getPayload({ config: configPromise })
  try {
    const { docs } = await payload.find({
      collection: 'settings',
      depth: 1,
      pagination: false,
      select: { tenant: true },
      where: { or: fields.map((field): Where => ({ [field]: { equals: id } })) },
    })

    for (const { tenant } of docs) {
      if (isValidRelationship(tenant)) revalidateTag(centerSettingsTag(tenant.slug))
    }
  } catch (err) {
    payload.logger.error({ err }, `Error revalidating settings for ${collection} ID ${id}`)
  }
}

/** For deletes: the settings row no longer points at the document, so its tenant is all there is. */
export async function revalidateTenantSettings(tenant: number | Tenant) {
  try {
    const { slug } = await resolveTenant(tenant)
    revalidateTag(centerSettingsTag(slug))
  } catch (err) {
    const payload = await getPayload({ config: configPromise })
    payload.logger.warn({ err }, 'Could not resolve tenant to revalidate its settings')
  }
}
