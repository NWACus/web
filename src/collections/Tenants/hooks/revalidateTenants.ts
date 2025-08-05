import { revalidatePath, revalidateTag } from 'next/cache'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

export const revalidateTenantsAfterChange: CollectionAfterChangeHook = async ({
  req: { payload },
  doc,
  previousDoc,
  operation,
}) => {
  try {
    revalidateTag('tenants')
    payload.logger.info(
      `Successfully revalidated tenants cache after ${operation} on tenant: ${
        doc?.slug || doc?.id
      }`,
    )
  } catch (error) {
    payload.logger.error('Error revalidating tenant cache:', error)
  }

  const nameChange = doc.name !== previousDoc.name
  const customDomainChange = doc.customDomain !== previousDoc.customDomain

  if (nameChange || customDomainChange) {
    const changedFields = [nameChange && 'name', customDomainChange && 'customDomain'].filter(
      Boolean,
    )

    payload.logger.info(
      `Revalidating all paths for tenant ${doc.slug} due to ${changedFields.join(', ')} change`,
    )

    // Revalidate the tenant's root path and all nested paths
    revalidatePath(`/${doc.slug}`, 'layout')

    // Tenant name and customDomain are used at the root for tenant listings
    revalidatePath('/', 'layout')
  }
}

export const revalidateTenantsAfterDelete: CollectionAfterDeleteHook = async ({ req, doc }) => {
  try {
    revalidateTag('tenants')
    req.payload.logger.info(
      `Successfully revalidated tenants cache after delete on tenant: ${doc?.slug || doc?.id}`,
    )
  } catch (error) {
    req.payload.logger.error('Error revalidating tenant cache:', error)
  }
}
