import { RoleAssignment, User } from '@/payload-types'
import { Logger } from 'pino'

export const roleAssignmentsForUser = (logger: Logger, user: User): RoleAssignment[] => {
  const roleAssignments: RoleAssignment[] = []
  if (user.roles && user.roles.docs && user.roles.docs.length > 0) {
    for (const roleAssignment of user.roles.docs) {
      if (typeof roleAssignment === 'number') {
        logger.info(`unexpected role assignment as number!`)
        continue
      }
      if (roleAssignment.role) {
        if (typeof roleAssignment.role === 'number') {
          logger.info(`unexpected role ref in role assignment as number!`)
        }
        if (typeof roleAssignment.tenant === 'number') {
          logger.info(`unexpected tenant ref in role assignment as number!`)
        }
      }
      roleAssignments.push(roleAssignment)
    }
  }
  return roleAssignments
}
