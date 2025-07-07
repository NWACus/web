import { accessByTenant } from '@/access/byTenant'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { tenantField } from '@/fields/tenantField'
import type { CollectionConfig } from 'payload'

// A role assignment binds a user to a set of roles in a tenant.
export const RoleAssignments: CollectionConfig = {
  slug: 'roleAssignments',
  access: accessByTenant('roleAssignments'),
  admin: {
    group: 'Permissions',
    baseListFilter: filterByTenant,
    useAsTitle: 'roleName',
    defaultColumns: ['role', 'user'],
  },
  fields: [
    tenantField(),
    {
      name: 'role',
      type: 'relationship',
      index: true,
      relationTo: 'roles',
      saveToJWT: true,
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
}
