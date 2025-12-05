import { FieldAccess } from 'payload'
import { globalRoleAssignmentsForUser } from '../utilities/rbac/globalRoleAssignmentsForUser'
import { ruleMatches, ruleMethod } from '../utilities/rbac/ruleMatches'

// All actions that can be performed
const ALL_ACTIONS: ruleMethod[] = ['create', 'read', 'update', 'delete']

/**
 * Checks if a user has super admin permissions, meaning they can perform all actions
 * on all collections and globals.
 *
 * This function checks two ways a user can have super admin permissions:
 * 1. They have a rule with actions: ['*'] and collections: ['*'] (wildcard rule)
 * 2. They have explicit rules that cover all actions on all collections and globals
 *
 * @param user - The user to check permissions for
 * @returns true if the user has super admin permissions, false otherwise
 */
export const hasSuperAdminPermissions: FieldAccess = async ({
  req: { user, payload },
}): Promise<boolean> => {
  if (!user) return false

  try {
    const assignments = globalRoleAssignmentsForUser(payload.logger, user)

    if (!assignments.length) {
      return false
    }

    // Get all rules from all global role assignments
    const allRules = assignments
      .map((assignment) => {
        if (assignment.globalRole && typeof assignment.globalRole !== 'number') {
          return assignment.globalRole.rules
        }
        return []
      })
      .flat()

    // Check if there's a wildcard rule that grants all actions on all collections
    const hasWildcardRule = allRules.some(
      (rule) =>
        rule.actions.some((action) => action === '*') &&
        rule.collections.some((collection) => collection === '*'),
    )

    if (hasWildcardRule) {
      return true
    }

    // If no wildcard rule, check if the user has explicit permissions for all actions
    // on all collections and globals
    // Get all collection slugs from the payload instance
    const allCollectionSlugs = payload.config.collections.map(({ slug }) => slug)

    // Get all global slugs from the payload instance
    const allGlobalSlugs = payload.config.globals.map(({ slug }) => slug)

    const allCollectionsAndGlobals = [...allCollectionSlugs, ...allGlobalSlugs]

    // For each action, check if the user has permission for all collections/globals
    for (const action of ALL_ACTIONS) {
      for (const collectionOrGlobal of allCollectionsAndGlobals) {
        const hasPermission = allRules.some(ruleMatches(action, collectionOrGlobal))
        if (!hasPermission) {
          return false
        }
      }
    }

    // If we made it here, the user has all permissions on all collections/globals
    return true
  } catch (error) {
    payload.logger.error(
      `Error checking super admin permissions: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
    // If there's an error checking permissions, return false as a safe default
    return false
  }
}
