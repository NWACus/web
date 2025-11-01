import { byGlobalRole } from '@/access/byGlobalRole'
import { Access, CollectionConfig } from 'payload'

// byProviderRelationship allows users to access providers they're assigned to
// while maintaining full global role access for provider managers
export const byProviderRelationship: (method: 'create' | 'read' | 'update' | 'delete') => Access =
  (method) => async (args) => {
    if (!args.req.user) {
      return false
    }

    // Check global role access first (provider managers, super admins)
    const globalAccess = byGlobalRole(method, 'providers')(args)
    if (typeof globalAccess === 'boolean' ? globalAccess : true) {
      // if globalAccess returned anything but 'false', pass it along
      return globalAccess
    }

    // For users with provider relationships
    const userProviders = args.req.user.providers
    if (!userProviders || !Array.isArray(userProviders) || userProviders.length === 0) {
      return false
    }

    // Extract provider IDs from the user's providers relationship
    const providerIds = userProviders
      .map((provider) => (typeof provider === 'number' ? provider : provider?.id))
      .filter((id): id is number => typeof id === 'number')

    if (providerIds.length === 0) {
      return false
    }

    // For read access, return a where clause to filter by user's providers
    if (method === 'read') {
      return {
        id: {
          in: providerIds,
        },
      }
    }

    // For create/update/delete, only allow if the document is one of their providers
    // This will be checked against the document being accessed
    return {
      id: {
        in: providerIds,
      },
    }
  }

export const accessByProviderRelationship: CollectionConfig['access'] = {
  create: byProviderRelationship('create'),
  read: byProviderRelationship('read'),
  update: byProviderRelationship('update'),
  delete: byProviderRelationship('delete'),
}
