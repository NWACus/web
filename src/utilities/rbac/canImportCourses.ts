import { hasSuperAdminPermissions } from '@/access/hasSuperAdminPermissions'
import type { User } from '@/payload-types'
import { createLocalReq, type Payload } from 'payload'
import { isProviderManager } from './isProviderManager'

// Role assignments are loaded here, not read off `user`: field access strips them from users who
// can't read Global Roles, which includes Provider Managers.
export const canImportCourses = async (payload: Payload, user: User): Promise<boolean> => {
  const { docs } = await payload.find({
    collection: 'globalRoleAssignments',
    where: { user: { equals: user.id } },
    depth: 1,
    pagination: false,
  })
  const withRoles: User = { ...user, globalRoleAssignments: { docs } }

  if (await isProviderManager(payload, withRoles)) return true
  const req = await createLocalReq({ user: withRoles }, payload)
  return hasSuperAdminPermissions({ req })
}
