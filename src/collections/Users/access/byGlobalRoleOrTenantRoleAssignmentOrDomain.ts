import { byGlobalRole } from '@/access/byGlobalRole'
import { isProviderManager } from '@/utilities/rbac/isProviderManager'
import { roleAssignmentsForUser } from '@/utilities/rbac/roleAssignmentsForUser'
import { ruleMatches, ruleMethod } from '@/utilities/rbac/ruleMatches'
import { Access, CollectionConfig, Where } from 'payload'

// byGlobalRoleOrTenantRoleAssignmentOrDomain combines both tenant domain matching and role-based access
// Users will have their tenant scoped role assignments for the users collection apply if they either:
// 1. Have a role assignment for the same tenant, OR
// 2. Have a matching email domain to the tenant's customDomain
export const byGlobalRoleOrTenantRoleAssignmentOrDomain: (method: ruleMethod) => Access =
  (method: ruleMethod): Access =>
  async (args) => {
    if (!args.req.user) {
      return false
    }

    // allow users to read, update their own record
    if (args?.id === args.req.user.id && (method === 'read' || method === 'update')) {
      return true
    }

    const globalAccess = byGlobalRole(method, 'users')(args)
    if (typeof globalAccess === 'boolean' ? globalAccess : true) {
      // if globalAccess returned anything but 'false', pass it along
      return globalAccess
    }

    const roleAssignments = roleAssignmentsForUser(args.req.payload.logger, args.req.user)

    const userCollectionRoleAssignments = roleAssignments.filter(
      (assignment) =>
        assignment.role &&
        typeof assignment.role !== 'number' &&
        assignment.role.rules.some(ruleMatches(method, 'users')),
    )

    const conditions = []

    // Tenant scoped role based access
    const userCollectionRoleAssignmentsTenants = userCollectionRoleAssignments
      .map((assignment) => assignment.tenant)
      .filter((tenant) => typeof tenant !== 'number')

    if (userCollectionRoleAssignmentsTenants.length > 0) {
      conditions.push(
        ...userCollectionRoleAssignmentsTenants.map(({ id: tenantId }) => ({
          'roles.tenant.id': {
            equals: tenantId,
          },
        })),
      )
    }

    // Domain based access (matching email domain)
    const matchingTenantDomains = userCollectionRoleAssignments
      .map((assignment) => assignment.tenant)
      .filter((tenant) => typeof tenant !== 'number')
      .map((tenant) => tenant.customDomain)
      .filter(Boolean)
      .flat()

    if (matchingTenantDomains.length > 0) {
      conditions.push(
        ...matchingTenantDomains.map((domain) => ({
          email: {
            contains: '@' + domain,
          },
        })),
      )
    }

    // Provider managers can see all users with provider relationship(s) and themselves
    if (method === 'read') {
      const isManager = await isProviderManager(args.req.payload, args.req.user)
      if (isManager) {
        const orConditions: Where[] = [
          {
            providers: {
              exists: true,
            },
          },
        ]

        if (args.req.user.id) {
          orConditions.push({
            id: {
              equals: args.req.user.id,
            },
          })
        }

        conditions.push({
          or: orConditions,
        })
      }
    }

    if (conditions.length > 0) {
      return {
        or: conditions,
      }
    }

    return false
  }

export const accessByGlobalRoleOrTenantRoleAssignmentOrDomain: CollectionConfig['access'] = {
  create: () => false, // Disallow create for the users collection in favor of a custom invite flow which uses the create rule on the users collection
  read: byGlobalRoleOrTenantRoleAssignmentOrDomain('read'),
  update: byGlobalRoleOrTenantRoleAssignmentOrDomain('update'),
  delete: byGlobalRoleOrTenantRoleAssignmentOrDomain('delete'),
}
