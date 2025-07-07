import { byTenant } from '@/access/byTenant'
import { ruleCollection } from '@/utilities/rbac/ruleMatches'
import { Access, CollectionConfig } from 'payload'

// byTenantWithSelfRead allows users to read their own role assignments
// while using standard tenant-based access for all other operations
export const byTenantWithSelfRead: (collection: ruleCollection) => Access =
  (collection: ruleCollection): Access =>
  async (args) => {
    if (!args.req.user) {
      return false
    }

    // First check if user has normal tenant-based read access
    const tenantAccess = await byTenant('read', collection)(args)
    if (typeof tenantAccess === 'boolean' && tenantAccess) {
      // If they have full tenant access, allow it
      return true
    }

    // Build conditions for the OR clause
    const conditions = []

    // Add tenant access condition if it's a Where object
    if (typeof tenantAccess === 'object' && tenantAccess !== null) {
      conditions.push(tenantAccess)
    }

    // Add self-access condition
    conditions.push({
      user: {
        equals: args.req.user.id,
      },
    })

    // Return OR clause with both conditions
    return {
      or: conditions,
    }
  }

export const accessByTenantWithSelfRead: (
  collection: ruleCollection,
) => CollectionConfig['access'] = (collection: ruleCollection) => {
  return {
    create: byTenant('create', collection),
    read: byTenantWithSelfRead(collection),
    update: byTenant('update', collection),
    delete: byTenant('delete', collection),
  }
}
