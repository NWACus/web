import type { User } from '@/payload-types'
import payload, { ClientUser } from 'payload'
import { globalRolesForUser } from './globalRolesForUser'
import { ruleCollection, ruleMatches } from './ruleMatches'

// Checks if a user has read-only access for a given collection based on their global roles.
// Returns true if the user can only read (no create, update, or delete permissions).
export const hasReadOnlyAccess = (
  user: User | ClientUser | null,
  collection: ruleCollection,
): boolean => {
  if (!user) return true

  try {
    const globalRoles = globalRolesForUser(payload.logger, user)

    const hasCreateAccess = globalRoles
      .map((role) => role.rules)
      .flat()
      .some(ruleMatches('create', collection))

    const hasUpdateAccess = globalRoles
      .map((role) => role.rules)
      .flat()
      .some(ruleMatches('update', collection))

    const hasDeleteAccess = globalRoles
      .map((role) => role.rules)
      .flat()
      .some(ruleMatches('delete', collection))

    return !hasCreateAccess && !hasUpdateAccess && !hasDeleteAccess
  } catch (error) {
    payload.logger.error(
      `Error checking read only access: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
    // If there's an error checking permissions, return true as a safe default
    return true
  }
}
