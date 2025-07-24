import { revalidateTag } from 'next/cache'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

export const revalidateTenantsAfterChange: CollectionAfterChangeHook = async ({
  doc,
  operation,
}) => {
  try {
    revalidateTag('tenants')
    console.log(
      `Successfully revalidated tenants cache after ${operation} on tenant: ${
        doc?.slug || doc?.id
      }`,
    )
  } catch (error) {
    console.error('Error revalidating tenant cache:', error)
  }
}

export const revalidateTenantsAfterDelete: CollectionAfterDeleteHook = async ({ doc }) => {
  try {
    revalidateTag('tenants')
    console.log(
      `Successfully revalidated tenants cache after delete on tenant: ${doc?.slug || doc?.id}`,
    )
  } catch (error) {
    console.error('Error revalidating tenant cache:', error)
  }
}
