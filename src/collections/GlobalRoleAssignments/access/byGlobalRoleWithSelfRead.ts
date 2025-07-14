import { byGlobalRole } from '@/access/byGlobalRole'
import { ruleCollection } from '@/utilities/rbac/ruleMatches'
import { Access, CollectionConfig } from 'payload'

// byGlobalRoleWithSelfRead allows users to read their own global role assignments
// while using standard global role-based access for all other operations
export const byGlobalRoleWithSelfRead: (collection: ruleCollection) => Access =
  (collection: ruleCollection): Access =>
  async (args) => {
    if (!args.req.user) {
      return false
    }

    // First check if user has normal global role-based read access
    const globalAccess = await byGlobalRole('read', collection)(args)
    if (typeof globalAccess === 'boolean' && globalAccess) {
      // If they have full global access, allow it
      return true
    }

    // Build conditions for the OR clause
    const conditions = []

    // Add global access condition if it's a Where object
    if (typeof globalAccess === 'object' && globalAccess !== null) {
      conditions.push(globalAccess)
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

export const accessByGlobalRoleWithSelfRead: (
  collection: ruleCollection,
) => CollectionConfig['access'] = (collection: ruleCollection) => {
  return {
    create: byGlobalRole('create', collection),
    read: byGlobalRoleWithSelfRead(collection),
    update: byGlobalRole('update', collection),
    delete: byGlobalRole('delete', collection),
  }
}
