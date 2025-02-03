import { Access, CollectionConfig } from 'payload'
import { globalRolesForUser } from '@/utilities/rbac/globalRolesForUser'
import { ruleCollection, ruleMethod, ruleMatches } from '@/utilities/rbac/ruleMatches'
import { roleAssignmentsForUser } from '@/utilities/rbac/roleAssignmentsForUser'
import { defaultTenantIdFromHeaders } from '@/utilities/tenancy/defaultTenantIdFromHeaders'

// byTenant walks the roles bound to the user to determine if they have permissions
// to take the specified action on a resource of the collection type. Used for
// tenant-scoped collections
export const byTenant: (method: ruleMethod, collection: ruleCollection) => Access =
  (method: ruleMethod, collection: ruleCollection): Access =>
  async ({ req: { user, payload } }) => {
    if (!user) {
      return false
    }

    const globalRoles = globalRolesForUser(payload.logger, user)

    const globalRolesMatch = globalRoles
      .map((role) => role.rules)
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
          assignment.roles &&
          assignment.roles
            .filter((role) => typeof role !== 'number') // captured in the getter
            .map((role) => role.rules)
            .flat()
            .some(ruleMatches(method, collection)),
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

  export const accessByTenant: (collection: ruleCollection) => CollectionConfig['access'] = (collection: ruleCollection) => {
    return {
      create: byTenant('create', collection),
      read: byTenant('read', collection),
      update: byTenant('update', collection),
      delete: byTenant('delete', collection),
    }
  }
