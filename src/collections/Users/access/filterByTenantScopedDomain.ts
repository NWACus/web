import { byGlobalRole } from '@/access/byGlobalRole'
import { isTenantDomainScoped } from '@/utilities/tenancy/isTenantDomainScoped'
import { BaseFilter, Where } from 'payload'

// filterByTenantScopedDomain filters the users collection if the current domain is a tenant-scoped
// subdomain or custom domain.
export const filterByTenantScopedDomain: BaseFilter = async ({ req }) => {
  const { tenant } = await isTenantDomainScoped()

  if (!tenant) {
    return null
  }

  const conditions: Where[] = [
    // Users with tenant-scoped role assignments for this specific tenant
    {
      'roles.tenant.id': {
        equals: tenant.id,
      },
    },
  ]

  const hasGlobalUsersRead = byGlobalRole('read', 'users')({ req })

  if (hasGlobalUsersRead) {
    conditions.push(
      // Users with global role assignments (have access across all tenants)
      {
        globalRoleAssignments: {
          exists: true,
        },
      },
    )
  }

  return {
    or: conditions,
  }
}
