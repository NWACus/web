import { contentHashField } from '@/fields/contentHashField'
import { hasReadOnlyAccess } from '@/utilities/rbac/hasReadOnlyAccess'
import type { CollectionConfig } from 'payload'
import { accessByGlobalRoleWithSelfRead } from './access/byGlobalRoleWithSelfRead'

// A global role assignment binds a user to a set of roles in all tenants.
export const GlobalRoleAssignments: CollectionConfig = {
  slug: 'globalRoleAssignments',
  access: accessByGlobalRoleWithSelfRead('globalRoleAssignments'),
  admin: {
    group: 'Permissions',
    useAsTitle: 'globalRoleName',
    defaultColumns: ['globalRole', 'user'],
    hidden: ({ user }) => hasReadOnlyAccess(user, 'globalRoleAssignments'),
  },
  fields: [
    {
      name: 'globalRole',
      type: 'relationship',
      index: true,
      relationTo: 'globalRoles',
      saveToJWT: true,
      admin: {
        allowEdit: false,
      },
    },
    {
      name: 'globalRoleName',
      type: 'text',
      virtual: 'globalRole.name',
      admin: {
        hidden: true,
        disableListColumn: true,
        disableListFilter: true,
      },
    },
    {
      name: 'user',
      type: 'relationship',
      index: true,
      relationTo: 'users',
      saveToJWT: true,
    },
    contentHashField(),
  ],
}
