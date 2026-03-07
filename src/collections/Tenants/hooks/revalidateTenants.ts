import { revalidatePath, revalidateTag } from 'next/cache'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

export const revalidateTenantsAfterChange: CollectionAfterChangeHook = async ({
  req: { payload, context },
  doc,
  previousDoc,
  operation,
}) => {
  if (context.disableRevalidate) return

  try {
    revalidateTag('tenants')
    payload.logger.info(
      `Successfully revalidated tenants cache after ${operation} on tenant: ${
        doc?.slug || doc?.id
      }`,
    )
  } catch (error) {
    payload.logger.error({ err: error }, 'Error revalidating tenant cache')
  }

  const nameChange = doc.name !== previousDoc.name

  if (nameChange) {
    payload.logger.info(`Revalidating all paths for tenant ${doc.slug} due to name change`)

    // Revalidate the tenant's root path and all nested paths
    revalidatePath(`/${doc.slug}`, 'layout')

    // Tenant name is used at the root for tenant listings
    revalidatePath('/', 'layout')
  }
}

export const revalidateTenantsAfterDelete: CollectionAfterDeleteHook = async ({
  req: { context },
  req,
  doc,
}) => {
  if (context.disableRevalidate) return

  try {
    revalidateTag('tenants')
    req.payload.logger.info(
      `Successfully revalidated tenants cache after delete on tenant: ${doc?.slug || doc?.id}`,
    )
  } catch (error) {
    req.payload.logger.error({ err: error }, 'Error revalidating tenant cache')
  }
}
