import type { HomePage } from '@/payload-types'
import { resolveTenant } from '@/utilities/resolveTenant'
import { revalidatePath, revalidateTag } from 'next/cache'
import type { BasePayload, CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

const revalidate = async (doc: HomePage, payload: BasePayload) => {
  try {
    const tenant = await resolveTenant(doc.tenant, payload)

    const tenantHomePath = `/${tenant.slug}`
    payload.logger.info(`Revalidating path: ${tenantHomePath}`)
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

export const revalidateHomePage: CollectionAfterChangeHook<HomePage> = async ({
  doc,
  req: { payload, context, query },
}) => {
  if (context.disableRevalidate) return

  if (query && query.autosave === 'true') return

  payload.logger.info(`Revalidating tenant home page...`)
  await revalidate(doc, payload)
}

export const revalidateHomePageDelete: CollectionAfterDeleteHook<HomePage> = async ({
  doc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) return

  payload.logger.info(`Revalidating tenant home page after delete...`)
  await revalidate(doc, payload)
}
