import type { Access, CollectionConfig } from 'payload'
import { globalRolesForUser } from '@/utilities/rbac/globalRolesForUser'
import { ruleMatches, ruleMethod, ruleCollection } from '@/utilities/rbac/ruleMatches'

// byGlobalRole walks the global roles bound to the user to determine if they have permissions
// to take the specified action on a resource of the collection type at the global scope
export const byGlobalRole: (method: ruleMethod, collection: ruleCollection) => Access =
  (method: ruleMethod, collection: ruleCollection): Access =>
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
