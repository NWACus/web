import type { Member } from '@/payload-types'

/**
 * Type guard for a Member resolved by the Better Auth strategy, as opposed to a staff User or an
 * MCP API key. Uses the `collection` discriminator Payload adds to every auth collection document.
 */
export function isMember(user: unknown): user is Member & { collection: 'members' } {
  if (typeof user !== 'object' || user === null || !('collection' in user)) {
    return false
  }
  return user.collection === 'members'
}
