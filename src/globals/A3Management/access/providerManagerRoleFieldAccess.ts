import { hasSuperAdminPermissions } from '@/access/hasSuperAdminPermissions'
import { isProviderManager } from '@/utilities/rbac/isProviderManager'
import { FieldAccess } from 'payload'

/**
 * Field-level access control for the approved courseTypes field.
 * Only provider managers and users with global roles that grant provider permissions
 * can update approved courseTypes.
 */
const canCreateAndUpdate: FieldAccess = async ({ req }) => {
  if (!req.user) {
    return false
  }

  const isSuperAdmin = await hasSuperAdminPermissions({ req })
  if (isSuperAdmin) {
    return true
  }

  // We don't want anyone with the selected provider manager role to change which role is selected
  // as the provider manager role
  const isManager = await isProviderManager(req.payload, req.user)
  if (isManager) {
    return false
  }

  // user already has access to this collection
  return true
}

export const providerManagerRoleFieldAccess = {
  read: () => true, // Everyone with collection access can read
  create: canCreateAndUpdate,
  update: canCreateAndUpdate,
}
