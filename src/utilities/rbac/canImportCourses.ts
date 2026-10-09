import { hasSuperAdminPermissions } from '@/access/hasSuperAdminPermissions'
import type { User } from '@/payload-types'
import { createLocalReq, type Payload } from 'payload'
import { isProviderManager } from './isProviderManager'

/**
 * A Course Import changes the national catalog across many Providers, so it is limited to
 * Provider Managers and Super Admins. Provider Users manage only their own Courses.
 */
export const canImportCourses = async (payload: Payload, user: User): Promise<boolean> => {
  if (await isProviderManager(payload, user)) return true
  const req = await createLocalReq({ user }, payload)
  return hasSuperAdminPermissions({ req })
}
