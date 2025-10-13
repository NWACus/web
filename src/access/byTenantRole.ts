import { globalRoleAssignmentsForUser } from '@/utilities/rbac/globalRoleAssignmentsForUser'
import { roleAssignmentsForUser } from '@/utilities/rbac/roleAssignmentsForUser'
import { ruleCollection, ruleMatches, ruleMethod } from '@/utilities/rbac/ruleMatches'
import { getTenantFromCookie } from '@/utilities/tenancy/getTenantFromCookie'
import { Access, CollectionConfig } from 'payload'

// byTenantRole walks the roles bound to the user to determine if they have permissions
// to take the specified action on a resource of the collection type. Used for
// tenant-scoped collections
export const byTenantRole: (method: ruleMethod, collection: ruleCollection) => Access =
  (method: ruleMethod, collection: ruleCollection): Access =>
  async ({ req: { user, payload } }) => {
    if (!user) {
      return false
    }

    const globalAssignments = globalRoleAssignmentsForUser(payload.logger, user)
    const globalRolesMatch = globalAssignments
      .map((assignment) => {
        if (assignment.globalRole && typeof assignment.globalRole !== 'number') {
          return assignment.globalRole.rules
        }
        return []
      })
      .flat()
      .some(ruleMatches(method, collection))
    if (globalRolesMatch) {
      // user has access globally, access everything
      return true
    }

    const roleAssignments = roleAssignmentsForUser(payload.logger, user)
    const matchingTenantIds = roleAssignments
      .filter(
        (assignment) =>
          assignment.role &&
          typeof assignment.role !== 'number' && // captured in the getter
          assignment.role.rules.some(ruleMatches(method, collection)),
      )
      .map((assignment) => assignment.tenant)
      .filter((tenant) => typeof tenant !== 'number') // captured in the getter
      .map((tenant) => tenant.id)

    if (matchingTenantIds.length > 0) {
      // otherwise, return a where clause capturing the tenants they can take this action in
      return {
        tenant: {
          in: matchingTenantIds,
        },
      }
    }

    return false
  }

export const accessByTenantRole: (collection: ruleCollection) => CollectionConfig['access'] = (
  collection: ruleCollection,
) => {
  return {
    create: ({ req }) => {
      const tenantFromCookie = getTenantFromCookie(req.headers, 'number')
      return tenantFromCookie ? byTenantRole('create', collection)({ req }) : false
    },
    read: byTenantRole('read', collection),
    update: byTenantRole('update', collection),
    delete: byTenantRole('delete', collection),
  }
}

export const accessByTenantRoleWithPermissiveRead: (
  collection: ruleCollection,
) => CollectionConfig['access'] = (collection: ruleCollection) => {
  return {
    create: accessByTenantRole(collection)?.create,
    read: () => true, // world readable
    update: byTenantRole('update', collection),
    delete: byTenantRole('delete', collection),
  }
}
