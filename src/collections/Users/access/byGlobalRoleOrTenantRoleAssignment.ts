import { byGlobalRole } from '@/access/byGlobalRole'
import { roleAssignmentsForUser } from '@/utilities/rbac/roleAssignmentsForUser'
import { ruleMatches, ruleMethod } from '@/utilities/rbac/ruleMatches'
import { Access, CollectionConfig } from 'payload'

// byGlobalRoleOrTenantRoleAssignment supplants global access review with tenant-scoped user grants, allowing tenant
// scoped role assignments for user access to apply for all users with a role assignment scoped to the same tenant as
// the logged in user. If the logged in user has user collection roles for multiple tenants they will see users from
// those tenants.
export const byGlobalRoleOrTenantRoleAssignment: (method: ruleMethod) => Access =
  (method: ruleMethod): Access =>
  (args) => {
    if (!args.req.user) {
      return false
    }

    const globalAccess = byGlobalRole(method, 'users')(args)
    if (typeof globalAccess === 'boolean' ? globalAccess : true) {
      // if globalAccess returned anything but 'false', pass it along
      return globalAccess
    }

    const roleAssignments = roleAssignmentsForUser(args.req.payload.logger, args.req.user)

    const userCollectionRoleAssignments = roleAssignments.filter(
      (assignment) =>
        assignment.roles &&
        assignment.roles
          .filter((role) => typeof role !== 'number')
          .map((role) => role.rules)
          .flat()
          .some(ruleMatches(method, 'users')),
    )

    const userCollectionRoleAssignmentsTenants = userCollectionRoleAssignments
      .map((assignment) => assignment.tenant)
      .filter((tenant) => typeof tenant !== 'number')

    if (userCollectionRoleAssignmentsTenants.length > 0) {
      return {
        or: userCollectionRoleAssignmentsTenants.map(({ id: tenantId }) => ({
          'roles.tenant.id': {
            equals: tenantId,
          },
        })),
      }
    }

    return false
  }

export const accessByGlobalRoleOrTenantRoleAssignment: CollectionConfig['access'] = {
  create: byGlobalRoleOrTenantRoleAssignment('create'), // TODO: nobody but SSO creates users?
  read: byGlobalRoleOrTenantRoleAssignment('read'), // TODO: allow self-read
  update: byGlobalRoleOrTenantRoleAssignment('update'), // TODO: allow self-update
  delete: byGlobalRoleOrTenantRoleAssignment('delete'),
}
