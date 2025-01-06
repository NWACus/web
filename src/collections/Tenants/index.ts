import type { CollectionConfig } from 'payload'
import { accessByGlobalRoleOrTenantIds } from '@/collections/Tenants/access/byGlobalRoleOrTenantIds'

export const Tenants: CollectionConfig = {
  slug: 'tenants',
  access: accessByGlobalRoleOrTenantIds,
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    // The domains field allows you to associate one or more domains with a tenant.
    // This is used to determine which tenant is associated with a specific domain,
    // for example, 'abc.localhost.com' would match to 'Tenant 1'.
    {
      name: 'domains',
      type: 'array',
      fields: [
        {
          name: 'domain',
          type: 'text',
          required: true,
        },
      ],
      index: true,
    },
    {
      name: 'slug',
      type: 'text',
      admin: {
        description: 'Used for url paths, example: /tenant-slug/page-slug',
      },
      index: true,
      required: true,
      unique: true,
    },
  ],
}
