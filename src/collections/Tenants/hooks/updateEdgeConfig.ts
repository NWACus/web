import { updateEdgeConfig } from '@/services/vercel'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

interface EdgeConfigPayload {
  items: Array<{
    key: string
    value?: unknown
    operation: 'upsert' | 'delete'
  }>
}

export const updateEdgeConfigAfterChange: CollectionAfterChangeHook = async ({
  req,
  doc,
  previousDoc,
  operation,
}) => {
  try {
    const tenant = {
      id: doc.id,
      slug: doc.slug,
      customDomain: doc.customDomain || null,
    }

    const items: EdgeConfigPayload['items'] = []

    // If this is an update and slug or customDomain changed, remove old keys
    if (operation === 'update' && previousDoc) {
      const previousTenant = {
        id: previousDoc.id,
        slug: previousDoc.slug,
        customDomain: previousDoc.customDomain || null,
      }

      const oldTenantKey = `tenant_${previousTenant.slug}`
      const newTenantKey = `tenant_${tenant.slug}`

      // If slug changed, remove old key
      if (oldTenantKey !== newTenantKey) {
        items.push({
          key: oldTenantKey,
          operation: 'delete',
        })
      }
    }

    // Add tenant with tenant_ prefix
    const tenantKey = `tenant_${tenant.slug}`
    items.push({
      key: tenantKey,
      value: tenant,
      operation: 'upsert',
    })

    if (items.length > 0) {
      await updateEdgeConfig({ items })
      req.payload.logger.info(
        `Successfully updated Edge Config after ${operation} on tenant: ${doc.slug} (${items.length} operations)`,
      )
    } else {
      req.payload.logger.info(`No Edge Config updates needed for tenant: ${doc.slug}`)
    }
  } catch (error) {
    req.payload.logger.error({ err: error }, `Error updating Edge Config for tenant ${doc.slug}`)
  }
}

export const updateEdgeConfigAfterDelete: CollectionAfterDeleteHook = async ({ req, doc }) => {
  try {
    const tenant = {
      id: doc.id,
      slug: doc.slug,
      customDomain: doc.customDomain || null,
    }

    const tenantKey = `tenant_${tenant.slug}`
    const items: EdgeConfigPayload['items'] = [
      {
        key: tenantKey,
        operation: 'delete' as const,
      },
    ]

    if (items.length > 0) {
      await updateEdgeConfig({ items })
      req.payload.logger.info(
        `Successfully removed tenant ${doc.slug} from Edge Config (${items.length} keys deleted)`,
      )
    }
  } catch (error) {
    req.payload.logger.error({ err: error }, `Error removing tenant ${doc.slug} from Edge Config`)
  }
}
