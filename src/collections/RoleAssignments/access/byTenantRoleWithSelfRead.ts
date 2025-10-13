import { accessByTenantRole, byTenantRole } from '@/access/byTenantRole'
import { ruleCollection } from '@/utilities/rbac/ruleMatches'
import { Access, CollectionConfig } from 'payload'

// byTenantRoleWithSelfRead allows users to read their own role assignments
// while using standard tenant-based access for all other operations
export const byTenantRoleWithSelfRead: (collection: ruleCollection) => Access =
  (collection: ruleCollection): Access =>
  async (args) => {
    if (!args.req.user) {
      return false
    }

    // First check if user has normal tenant-based read access
    const tenantAccess = await byTenantRole('read', collection)(args)
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

export const accessByTenantRoleWithSelfRead: (
  collection: ruleCollection,
) => CollectionConfig['access'] = (collection: ruleCollection) => {
  return {
    create: accessByTenantRole(collection)?.create,
    read: byTenantRoleWithSelfRead(collection),
    update: byTenantRole('update', collection),
    delete: byTenantRole('delete', collection),
  }
}
