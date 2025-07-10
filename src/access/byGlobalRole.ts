import { globalRolesForUser } from '@/utilities/rbac/globalRolesForUser'
import { ruleCollection, ruleMatches, ruleMethod } from '@/utilities/rbac/ruleMatches'
import type { CollectionConfig, FieldAccess } from 'payload'

// byGlobalRole walks the global roles bound to the user to determine if they have permissions
// to take the specified action on a resource of the collection type at the global scope
export const byGlobalRole: (method: ruleMethod, collection: ruleCollection) => FieldAccess =
  (method: ruleMethod, collection: ruleCollection): FieldAccess =>
  ({ req: { user, payload } }) => {
    if (!user) {
      return false
    }

    payload.logger.debug(`evaluating access by ${user.id} for ${method} on ${collection}`)

    const globalRoles = globalRolesForUser(payload.logger, user)
    return globalRoles
      .map((role) => role.rules)
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
