import { hasSuperAdminPermissions } from '@/access/hasSuperAdminPermissions'
import { isProviderManager } from '@/utilities/rbac/isProviderManager'
import { FieldAccess } from 'payload'

/**
 * Field-level access control for the accreditations field.
 * Only provider managers and users with global roles that grant provider permissions
 * can update accreditations.
 */
const canCreateAndUpdate: FieldAccess = async ({ req }) => {
  if (!req.user) {
    return false
  }

  const isSuperAdmin = await hasSuperAdminPermissions({ req })
  if (isSuperAdmin) {
    return true
  }

  const isManager = await isProviderManager(req.payload, req.user)
  if (isManager) {
    return true
  }

  return false
}

export const courseTypesFieldAccess = {
  read: () => true, // Everyone with collection access can read
  create: canCreateAndUpdate,
  update: canCreateAndUpdate,
}
