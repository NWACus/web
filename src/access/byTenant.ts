import { Access, CollectionConfig } from 'payload'
import { globalRolesForUser } from '@/utilities/rbac/globalRolesForUser'
import { ruleMatches } from '@/utilities/rbac/ruleMatches'
import { roleAssignmentsForUser } from '@/utilities/rbac/roleAssignmentsForUser'
import { defaultTenantIdFromHeaders } from '@/utilities/tenancy/defaultTenantIdFromHeaders'

// byTenant walks the roles bound to the user to determine if they have permissions
// to take the specified action on a resource of the collection type. Used for
// tenant-scoped collections
export const byTenant: (method: string, collection: string) => Access =
  (method: string, collection: string): Access =>
  async ({ req: { user, headers, payload } }) => {
    if (!user) {
      return false
    }

    // TODO: remove defaultTenantId handling from here if Jarrod confirms design
    const defaultTenantId = await defaultTenantIdFromHeaders(headers, payload)
    payload.logger.debug(`evaluating access by ${user.id} for ${method} on ${collection}`)

    const globalRoles = globalRolesForUser(payload.logger, user)

    const globalRolesMatch = globalRoles
      .map((role) => role.rules)
      .flat()
      .some(ruleMatches(method, collection))
    if (globalRolesMatch) {
      // user has access globally, scope if cookie requests it
      if (defaultTenantId !== undefined) {
        return {
          tenant: {
            equals: defaultTenantId,
          },
        }
      }

      // otherwise, access everything
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

    if (defaultTenantId && matchingTenantIds.includes(defaultTenantId)) {
      // scope if the cookie asks for it and the user otherwise has access
      return {
        tenant: {
          equals: defaultTenantId,
        },
      }
    }

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

  export const accessByTenant: (collection: string) => CollectionConfig['access'] = (collection: string) => {
    return {
      create: byTenant('create', collection),
      read: byTenant('read', collection),
      update: byTenant('update', collection),
      delete: byTenant('delete', collection),
    }
  }
