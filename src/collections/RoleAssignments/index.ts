import type { CollectionConfig } from 'payload'
import { accessByTenant } from '@/access/byTenant'
import { tenantField } from '@payloadcms/plugin-multi-tenant/fields'

const customizedTenantField = tenantField({
  name: 'tenant',
  tenantsCollectionSlug: 'tenants',
  unique: false,
  access: {
    read: () => true,
    update: () => true,
  },
})

// A role assignment binds a user to a set of roles in a tenant.
export const RoleAssignments: CollectionConfig = {
  slug: 'roleAssignments',
  access: accessByTenant('roleAssignments'),
  admin: {
    group: 'Permissions',
  },
  fields: [
    {
      ...customizedTenantField,
      label: 'Avalanche Center',
    },
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
