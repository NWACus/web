import type { CollectionBeforeChangeHook } from 'payload'

/**
 * Syncs role-specific content fields (tenantContent or providerContent) to the unified content field
 * This allows frontend rendering to always use the 'content' field regardless of who edited it
 *
 * The content type is determined by whether the event has a provider, not by who's editing it:
 * - Events WITH a provider use providerContent (limited blocks)
 * - Events WITHOUT a provider use tenantContent (full blocks)
 */
export const syncContentFields: CollectionBeforeChangeHook = async ({ data, operation }) => {
  // Only sync during create and update operations
  if (operation !== 'create' && operation !== 'update') {
    return data
  }

  const hasProvider = !!data?.provider

  // Sync the appropriate content field to the unified content field based on event type
  if (hasProvider && data?.providerContent) {
    data.content = data.providerContent
  } else if (!hasProvider && data?.tenantContent) {
    data.content = data.tenantContent
  }

  return data
}
