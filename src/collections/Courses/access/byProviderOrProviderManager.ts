import { byGlobalRole } from '@/access/byGlobalRole'
import { isProviderManager } from '@/utilities/rbac/isProviderManager'
import { ruleMethod } from '@/utilities/rbac/ruleMatches'
import { Access, CollectionConfig } from 'payload'

// byProviderOrProviderManager allows global role access, provider manager access, or access based on the provider
// relationships a user has
export const byProviderOrProviderManager: (method: ruleMethod) => Access =
  (method) => async (args) => {
    if (!args.req.user) {
      return false
    }

    // Check global role access first (provider managers, super admins)
    const globalAccess = byGlobalRole(method, 'courses')(args)
    if (typeof globalAccess === 'boolean' ? globalAccess : true) {
      // if globalAccess returned anything but 'false', pass it along
      return globalAccess
    }

    const isManager = await isProviderManager(args.req.payload, args.req.user)
    if (isManager) {
      return true
    }

    // Check if user has provider relationships
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

    // Build provider access constraint
    const providerConstraint = {
      provider: {
        in: providerIds,
      },
    }

    return providerConstraint
  }

export const accessByProviderOrProviderManager: CollectionConfig['access'] = {
  create: byProviderOrProviderManager('create'),
  read: byProviderOrProviderManager('read'),
  update: byProviderOrProviderManager('update'),
  delete: byProviderOrProviderManager('delete'),
}
