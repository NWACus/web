import { Role, User } from '@/payload-types'
import { Logger } from 'pino'

export const globalRolesForUser = (logger: Logger, user: User): Role[] => {
  const globalRoles: Role[] = []
  if (user.globalRoles && user.globalRoles.docs && user.globalRoles.docs.length > 0) {
    for (const globalRoleAssignment of user.globalRoles.docs) {
      if (typeof globalRoleAssignment === 'number') {
        logger.info(`unexpected global role assignment as number!`)
        continue
      }
      if (globalRoleAssignment.roles) {
        for (const role of globalRoleAssignment.roles) {
          if (typeof role === 'number') {
            logger.info(`unexpected role ref in global role assignment as number!`)
            continue
          }
          globalRoles.push(role)
        }
      }
    }
  }

  return globalRoles
}
