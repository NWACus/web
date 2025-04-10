import { accessByGlobalRole } from '@/access/byGlobalRole'
import type { CollectionConfig } from 'payload'

// A global role assignment binds a user to a set of roles in all tenants.
export const GlobalRoleAssignments: CollectionConfig = {
  slug: 'globalRoleAssignments',
  access: accessByGlobalRole('globalRoleAssignments'),
  admin: {
    group: 'Permissions',
  },
  fields: [
    {
      name: 'roles',
      type: 'relationship',
      index: true,
      relationTo: 'roles',
      hasMany: true,
      saveToJWT: true,
    },
    {
      name: 'user',
      type: 'relationship',
      index: true,
      relationTo: 'users',
      saveToJWT: true,
    },
  ],
}
