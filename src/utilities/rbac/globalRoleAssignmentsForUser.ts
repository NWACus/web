import { GlobalRoleAssignment, User } from '@/payload-types'
import { ClientUser } from 'payload'
import { Logger } from 'pino'

export const globalRoleAssignmentsForUser = (
  logger: Logger,
  user: User | ClientUser,
): GlobalRoleAssignment[] => {
  const assignments: GlobalRoleAssignment[] = []
  if (
    user.globalRoleAssignments &&
    user.globalRoleAssignments.docs &&
    user.globalRoleAssignments.docs.length > 0
  ) {
    for (const assignment of user.globalRoleAssignments.docs) {
      if (typeof assignment === 'number') {
        logger.info(`unexpected global role assignment as number!`)
        continue
      }
      if (assignment.globalRole && typeof assignment.globalRole === 'number') {
        logger.info(`unexpected globalRole ref in global role assignment as number!`)
      }
      assignments.push(assignment)
    }
  }
  return assignments
}
