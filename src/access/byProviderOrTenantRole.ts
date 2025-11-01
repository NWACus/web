import { byTenantRole } from '@/access/byTenantRole'
import { isProviderManager } from '@/utilities/rbac/isProviderManager'
import { getTenantFromCookie } from '@/utilities/tenancy/getTenantFromCookie'
import { Access, CollectionConfig } from 'payload'

// byProviderOrTenantRole extends tenant role access to also allow users with provider relationships
// to access events that belong to their providers
export const byProviderOrTenantRole: (method: 'create' | 'read' | 'update' | 'delete') => Access =
  (method) => async (args) => {
    if (!args.req.user) {
      return false
    }

    // First check tenant role access (including global roles)
    const tenantRoleAccess = await byTenantRole(method, 'events')(args)

    // If tenant role grants full access (true), return it
    if (tenantRoleAccess === true) {
      return true
    }

    const isManager = await isProviderManager(args.req.payload, args.req.user)
    if (isManager) {
      return {
        provider: {
          exists: true,
        },
      }
    }

    // Check if user has provider relationships
    const userProviders = args.req.user.providers
    if (!userProviders || !Array.isArray(userProviders) || userProviders.length === 0) {
      // No providers, return tenant role result (could be false or a where clause)
      return tenantRoleAccess
    }

    // Extract provider IDs from the user's providers relationship
    const providerIds = userProviders
      .map((provider) => (typeof provider === 'number' ? provider : provider?.id))
      .filter((id): id is number => typeof id === 'number')

    if (providerIds.length === 0) {
      return tenantRoleAccess
    }

    // Build provider access constraint
    const providerConstraint = {
      provider: {
        in: providerIds,
      },
    }

    // If tenant role returned a where clause, combine it with provider access using OR
    if (typeof tenantRoleAccess === 'object') {
      return {
        or: [tenantRoleAccess, providerConstraint],
      }
    }

    // Tenant role returned false, so only allow provider access
    return providerConstraint
  }

export const accessByProviderOrTenantRole: CollectionConfig['access'] = {
  create: async ({ req }) => {
    if (!req.user) {
      return false
    }

    const tenantFromCookie = getTenantFromCookie(req.headers, 'number')

    // Check tenant role access
    const tenantRoleAccess = await byTenantRole('create', 'events')({ req })

    // If user has tenant role access (true or where clause), tenant cookie is required
    if (tenantRoleAccess !== false) {
      if (!tenantFromCookie) {
        return false
      }
      // Tenant cookie is set, proceed with full access check
      return byProviderOrTenantRole('create')({ req })
    }

    // No tenant role access, check for provider relationships or provider manager status
    const isManager = await isProviderManager(req.payload, req.user)
    if (isManager) {
      return true
    }

    const userProviders = req.user?.providers
    if (!userProviders || !Array.isArray(userProviders) || userProviders.length === 0) {
      return false
    }

    // Extract provider IDs
    const providerIds = userProviders
      .map((provider) => (typeof provider === 'number' ? provider : provider?.id))
      .filter((id): id is number => typeof id === 'number')

    if (providerIds.length === 0) {
      return false
    }

    // User has provider relationships, allow create with provider constraint (no tenant cookie required)
    return {
      provider: {
        in: providerIds,
      },
    }
  },
  read: byProviderOrTenantRole('read'),
  update: byProviderOrTenantRole('update'),
  delete: byProviderOrTenantRole('delete'),
}
