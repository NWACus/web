import { revalidateTag } from 'next/cache'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

export const revalidateTenantsAfterChange: CollectionAfterChangeHook = async ({
  req,
  doc,
  operation,
}) => {
  try {
    revalidateTag('tenants')
    req.payload.logger.info(
      `Successfully revalidated tenants cache after ${operation} on tenant: ${
        doc?.slug || doc?.id
      }`,
    )
  } catch (error) {
    req.payload.logger.error('Error revalidating tenant cache:', error)
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
