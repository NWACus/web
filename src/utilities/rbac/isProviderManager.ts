import { User } from '@/payload-types'
import { ClientUser, Payload } from 'payload'
import { globalRoleAssignmentsForUser } from './globalRoleAssignmentsForUser'

/**
 * Checks if a user has the provider manager role defined in a3Management global
 */
export const isProviderManager = async (
  payload: Payload,
  user: User | ClientUser,
): Promise<boolean> => {
  try {
    const a3Management = await payload.findGlobal({
      slug: 'a3Management',
    })

    const providerManagerRoleId =
      typeof a3Management.providerManagerRole === 'number'
        ? a3Management.providerManagerRole
        : a3Management.providerManagerRole?.id

    if (!providerManagerRoleId) {
      return false
    }

    const userGlobalRoleAssignments = globalRoleAssignmentsForUser(payload.logger, user)
    return userGlobalRoleAssignments.some((assignment) => {
      const globalRoleId =
        typeof assignment.globalRole === 'number'
          ? assignment.globalRole
          : assignment.globalRole?.id
      return globalRoleId === providerManagerRoleId
    })
  } catch (error) {
    payload.logger.error(`Error checking if user is provider manager: ${error}`)
    return false
  }
}
