import { hasSuperAdminPermissions } from '@/access/hasSuperAdminPermissions'
import type { User } from '@/payload-types'
import { createLocalReq, type Payload } from 'payload'
import { isProviderManager } from './isProviderManager'

/**
 * A Course Import changes the national catalog across many Providers, so it is limited to
 * Provider Managers and Super Admins. Provider Users manage only their own Courses.
 *
 * The user's role assignments are loaded here rather than read off `user`: field access strips
 * `globalRoleAssignments` from users who can't read Global Roles, which includes Provider Managers.
 */
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
