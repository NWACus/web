import { GlobalRoleAssignment, User } from '@/payload-types'
import { ruleMatches } from './ruleMatches'

/**
 * Synchronous check if a user has provider access, either through:
 * 1. Having provider relationships, OR
 * 2. Having a global role with permissions on the providers collection
 *
 * This is used for admin UI conditions.
 */
export const hasProviderAccess = (user: User | null | undefined): boolean => {
  if (!user) {
    return false
  }

  // Check if user has provider relationships
  if (user.providers && Array.isArray(user.providers) && user.providers.length > 0) {
    return true
  }

  // Check if user has global role permissions for providers collection
  // Inline the globalRoleAssignmentsForUser logic to avoid logger dependency
  const assignments: GlobalRoleAssignment[] = []
  if (
    user.globalRoleAssignments &&
    user.globalRoleAssignments.docs &&
    user.globalRoleAssignments.docs.length > 0
  ) {
    for (const assignment of user.globalRoleAssignments.docs) {
      if (typeof assignment !== 'number') {
        assignments.push(assignment)
      }
    }
  }

  const hasProviderPermissions = assignments
    .map((assignment) => {
      if (assignment.globalRole && typeof assignment.globalRole !== 'number') {
        return assignment.globalRole.rules
      }
      return []
    })
    .flat()
    .some((rule) => {
      // Check if the rule grants any access to providers collection
      return (
        ruleMatches('create', 'providers')(rule) ||
        ruleMatches('read', 'providers')(rule) ||
        ruleMatches('update', 'providers')(rule) ||
        ruleMatches('delete', 'providers')(rule)
      )
    })

  return hasProviderPermissions
}
