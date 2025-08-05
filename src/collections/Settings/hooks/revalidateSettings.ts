import type { CollectionAfterChangeHook } from 'payload'

import { revalidatePath } from 'next/cache'

import type { Setting } from '@/payload-types'

export const revalidateSettings: CollectionAfterChangeHook<Setting> = async ({
  doc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    let tenant = doc.tenant

    if (typeof tenant === 'number') {
      tenant = await payload.findByID({
        collection: 'tenants',
        id: tenant,
        depth: 0,
      })
    }

    // Settings affect all pages since they appear in global components (header/footer)
    payload.logger.info(`Revalidating all paths for tenant ${tenant.slug} due to settings change`)

    // Revalidate the tenant's root path and all nested paths
    revalidatePath(`/${tenant.slug}`, 'layout')

    // Some tenant settings might be used in the avalanche centers listing (like logo and banner)
    revalidatePath('/', 'layout')
  }

  return doc
}
