import { globalRoleAssignmentsForUser } from '@/utilities/rbac/globalRoleAssignmentsForUser'
import { roleAssignmentsForUser } from '@/utilities/rbac/roleAssignmentsForUser'
import { isTenantDomainScoped } from '@/utilities/tenancy/isTenantDomainScoped'
import configPromise from '@payload-config'
import { CollectionBeforeLoginHook, getPayload } from 'payload'

// beforeLogin hooks run during login operations where a user with the provided credentials exist
// but before a token is generated and added to the response
// this hook validates that a user should be allowed to log in on a given domain based on their
// global roles, tenant scoped roles, or email domain
export const validateDomainAccessBeforeLogin: CollectionBeforeLoginHook = async ({ req, user }) => {
  const { isDomainScoped, tenant: domainScopedTenant } = await isTenantDomainScoped()

  if (!isDomainScoped) {
    return user
  }

  // if user has global role, let em through
  const globalRoleAssignments = globalRoleAssignmentsForUser(req.payload.logger, user)

  if (globalRoleAssignments.length > 0) {
    return user
  }

  // if a user has a role assignment for the domain scoped tenant, let em through
  const roleAssignments = roleAssignmentsForUser(req.payload.logger, user)

  if (roleAssignments.length) {
    const payload = await getPayload({ config: configPromise })

    for (const roleAssignmentId of roleAssignments.map(({ id }) => id)) {
      const roleAssignment = await payload.findByID({
        collection: 'roleAssignments',
        id: roleAssignmentId,
        select: {
          tenant: true,
        },
      })

      if (
        roleAssignment &&
        typeof roleAssignment.tenant !== 'number' &&
        roleAssignment.tenant.id === domainScopedTenant.id
      ) {
        return user
      }
    }
  }

  // if a user has an email domain matching the domain scoped tenant's customDomain, let em through
  if (user.email.endsWith('@' + domainScopedTenant.customDomain)) {
    return user
  }

  // otherwise, block em
  throw new Error('You are not allowed to access AvyFx on this domain.')
}
