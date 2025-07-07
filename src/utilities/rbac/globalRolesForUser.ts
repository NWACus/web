import { GlobalRole, User } from '@/payload-types'
import { Logger } from 'pino'

export const globalRolesForUser = (logger: Logger, user: User): GlobalRole[] => {
  const globalRoles: GlobalRole[] = []

  if (user.globalRoles && user.globalRoles.length > 0) {
    for (const globalRole of user.globalRoles) {
      if (typeof globalRole === 'number') {
        logger.info(`unexpected global role as number!`)
        continue
      }
      globalRoles.push(globalRole)
    }
  }

  return globalRoles
}
