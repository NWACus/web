import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { tenantField } from '@/fields/tenantField'
import { hasReadOnlyAccess } from '@/utilities/rbac/hasReadOnlyAccess'
import type { CollectionConfig } from 'payload'
import { accessByTenantRoleWithSelfRead } from './access/byTenantRoleWithSelfRead'
import { validateEscalation } from './hooks/validateEscalation'

// A role assignment binds a user to a set of roles in a tenant.
export const RoleAssignments: CollectionConfig = {
  slug: 'roleAssignments',
  access: accessByTenantRoleWithSelfRead('roleAssignments'),
  admin: {
    group: 'Permissions',
    baseListFilter: filterByTenant,
    useAsTitle: 'roleName',
    defaultColumns: ['role', 'user', 'tenant'],
    hidden: ({ user }) => hasReadOnlyAccess(user, 'roleAssignments'),
  },
  fields: [
    tenantField(),
    {
      name: 'role',
      type: 'relationship',
      index: true,
      relationTo: 'roles',
      saveToJWT: true,
      admin: {
        allowEdit: false,
      },
    },
    {
      name: 'roleName',
      type: 'text',
      virtual: 'role.name',
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
  hooks: {
    beforeValidate: [validateEscalation],
  },
}
