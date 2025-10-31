import { User } from '@/payload-types'
import { ClientUser, Payload } from 'payload'
import { globalRoleAssignmentsForUser } from './globalRoleAssignmentsForUser'
import { isProviderManager } from './isProviderManager'
import { ruleMatches } from './ruleMatches'

/**
 * Checks if a user can manage providers, either through:
 * 1. Being a provider manager (defined in aaaManagement), OR
 * 2. Having a global role with permissions on the providers collection
 */
export const canManageProviders = async (
  payload: Payload,
  user: User | ClientUser,
): Promise<boolean> => {
  // Check if user is a provider manager
  const isManager = await isProviderManager(payload, user)
  if (isManager) {
    return true
  }

  // Check if user has global role permissions for providers collection
  const assignments = globalRoleAssignmentsForUser(payload.logger, user)
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
