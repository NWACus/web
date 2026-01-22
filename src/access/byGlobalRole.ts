import { globalRoleAssignmentsForUser } from '@/utilities/rbac/globalRoleAssignmentsForUser'
import { ruleCollection, ruleMatches, ruleMethod } from '@/utilities/rbac/ruleMatches'
import type { CollectionConfig, FieldAccess } from 'payload'

// byGlobalRole walks the global role assignments bound to the user to determine if they have permissions
// to take the specified action on a resource of the collection type at the global scope
export const byGlobalRole: (method: ruleMethod, collection: ruleCollection) => FieldAccess =
  (method: ruleMethod, collection: ruleCollection): FieldAccess =>
  ({ req: { user, payload } }) => {
    if (!user) {
      return false
    }

    const assignments = globalRoleAssignmentsForUser(payload.logger, user)
    return assignments
      .map((assignment) => {
        if (assignment.globalRole && typeof assignment.globalRole !== 'number') {
          return assignment.globalRole.rules
        }
        return []
      })
      .flat()
      .some(ruleMatches(method, collection))
  }

export const accessByGlobalRole: (collection: ruleCollection) => CollectionConfig['access'] = (
  collection: ruleCollection,
) => {
  return {
    create: byGlobalRole('create', collection),
    read: byGlobalRole('read', collection),
    update: byGlobalRole('update', collection),
    delete: byGlobalRole('delete', collection),
  }
}

export const accessByGlobalRoleWithAuthenticatedRead: (
  collection: ruleCollection,
) => CollectionConfig['access'] = (collection: ruleCollection) => {
  return {
    create: byGlobalRole('create', collection),
    read: ({ req: { user } }) => !!user,
    update: byGlobalRole('update', collection),
    delete: byGlobalRole('delete', collection),
  }
}

export const accessByGlobalRoleReadOnly: (
  collection: ruleCollection,
) => CollectionConfig['access'] = (collection: ruleCollection) => {
  return {
    create: () => false,
    read: byGlobalRole('read', collection),
    update: () => false,
    delete: () => false,
  }
}
