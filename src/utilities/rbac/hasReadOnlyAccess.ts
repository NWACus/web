import type { User } from '@/payload-types'
import payload, { ClientUser } from 'payload'
import { globalRoleAssignmentsForUser } from './globalRoleAssignmentsForUser'
import { ruleCollection, ruleMatches } from './ruleMatches'

// Checks if a user has read-only access for a given collection based on their global role assignments.
// Returns true if the user can only read (no create, update, or delete permissions).
export const hasReadOnlyAccess = (
  user: User | ClientUser | null,
  collection: ruleCollection,
): boolean => {
  if (!user) return true

  try {
    const assignments = globalRoleAssignmentsForUser(payload.logger, user as User)

    const hasCreateAccess = assignments
      .map((assignment) => {
        if (assignment.globalRole && typeof assignment.globalRole !== 'number') {
          return assignment.globalRole.rules
        }
        return []
      })
      .flat()
      .some(ruleMatches('create', collection))

    const hasUpdateAccess = assignments
      .map((assignment) => {
        if (assignment.globalRole && typeof assignment.globalRole !== 'number') {
          return assignment.globalRole.rules
        }
        return []
      })
      .flat()
      .some(ruleMatches('update', collection))

    const hasDeleteAccess = assignments
      .map((assignment) => {
        if (assignment.globalRole && typeof assignment.globalRole !== 'number') {
          return assignment.globalRole.rules
        }
        return []
      })
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
