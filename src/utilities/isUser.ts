import type { User } from '@/payload-types'
import type { PayloadRequest } from 'payload'

/**
 * Type guard to distinguish a User from other auth collection types
 * (e.g., PayloadMcpApiKey). Uses the `collection` discriminator field
 * that Payload adds to all auth collection documents.
 */
export function isUser(user: unknown): user is User {
  if (typeof user !== 'object' || user === null || !('collection' in user)) {
    return false
  }
  // After the 'collection' in user check, TS narrows to { collection: unknown }
  return user.collection === 'users'
}

/**
 * Extract the authenticated User from a Payload request.
 * Returns null if not authenticated or authenticated as a different
 * auth collection type (e.g., PayloadMcpApiKey).
 */
export function getUser(req: Pick<PayloadRequest, 'user'>): User | null {
  return isUser(req.user) ? req.user : null
}
