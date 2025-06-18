import { byGlobalRole } from '@/access/byGlobalRole'
import { roleAssignmentsForUser } from '@/utilities/rbac/roleAssignmentsForUser'
import { ruleMatches, ruleMethod } from '@/utilities/rbac/ruleMatches'
import { Access, CollectionConfig } from 'payload'

// byGlobalRoleOrTenantDomain supplants global access review with tenant-scoped user grants, allowing tenant
// scoped role assignments for user access to apply for all users with e-mails under the tenant domain
export const byGlobalRoleOrTenantDomain: (method: ruleMethod) => Access =
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
    const matchingTenantDomains = roleAssignments
      .filter(
        (assignment) =>
          assignment.roles &&
          assignment.roles
            .filter((role) => typeof role !== 'number') // captured in the getter
            .map((role) => role.rules)
            .flat()
            .some(ruleMatches(method, 'users')),
      )
      .map((assignment) => assignment.tenant)
      .filter((tenant) => typeof tenant !== 'number') // captured in the getter
      .map((tenant) => tenant.customDomain)
      .filter(Boolean)
      .flat()

    if (matchingTenantDomains.length > 0) {
      return {
        or: matchingTenantDomains.map((domain) => ({
          email: {
            contains: '@' + domain,
          },
        })),
      }
    }

    return false
  }

export const accessByGlobalRoleOrTenantDomain: CollectionConfig['access'] = {
  create: byGlobalRoleOrTenantDomain('create'), // TODO: nobody but SSO creates users?
  read: byGlobalRoleOrTenantDomain('read'), // TODO: allow self-read
  update: byGlobalRoleOrTenantDomain('update'), // TODO: allow self-update
  delete: byGlobalRoleOrTenantDomain('delete'),
}
