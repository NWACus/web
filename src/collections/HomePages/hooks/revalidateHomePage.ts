import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import { resolveTenant } from '@/utilities/resolveTenant'

import type { HomePage } from '@/payload-types'

export const revalidateHomePage: CollectionAfterChangeHook<HomePage> = async ({
  doc,
  req: { payload, context, query },
}) => {
  if (context.disableRevalidate) return

  if (query && query.autosave === 'true') return

  try {
    const tenant = await resolveTenant(doc.tenant, payload)

    const tenantHomePath = `/${tenant.slug}`
    payload.logger.info(`Revalidating tenant home page: ${tenantHomePath}`)
    revalidatePath(tenantHomePath, 'page')

    const tenantHomeTag = `homePage-${tenant.slug}`
    payload.logger.info(`Revalidating tag: ${tenantHomeTag}`)
    revalidateTag(tenantHomeTag)

    payload.logger.info(`Revalidating global home page: /`)
    revalidatePath('/', 'page')

    payload.logger.info(`Successfully revalidated home page for tenant: ${tenant.slug}`)
  } catch (error) {
    payload.logger.error('Error revalidating home page:', error)
  }
}

export const revalidateHomePageDelete: CollectionAfterDeleteHook<HomePage> = async ({
  doc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) return

  try {
    const tenant = await resolveTenant(doc.tenant, payload)

    const tenantHomePath = `/${tenant.slug}`
    payload.logger.info(`Revalidating tenant home page after delete: ${tenantHomePath}`)
    revalidatePath(tenantHomePath)

    // Revalidate global home page (required for middleware path rewriting)
    // payload.logger.info(`Revalidating global home page after delete: /`)
    // revalidatePath('/')

    payload.logger.info(
      `Successfully revalidated home page after delete for tenant: ${tenant.slug}`,
    )
  } catch (error) {
    payload.logger.error('Error revalidating home page after delete:', error)
  }
}
