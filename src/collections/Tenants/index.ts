import { accessByGlobalRoleOrTenantIds } from '@/collections/Tenants/access/byGlobalRoleOrTenantIds'
import { contentHashField } from '@/fields/contentHashField'
import type { CollectionConfig } from 'payload'

export const Tenants: CollectionConfig = {
  slug: 'tenants',
  access: accessByGlobalRoleOrTenantIds,
  admin: {
    useAsTitle: 'name',
    group: 'Permissions',
  },
  labels: {
    plural: 'Avalanche Centers',
    singular: 'Avalanche Center',
  },
  defaultPopulate: {
    slug: true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'customDomain',
      type: 'text',
      label: 'Custom Domain',
    },
    {
      name: 'useCustomDomain',
      type: 'checkbox',
      label: 'Use Custom Domain',
      defaultValue: false,
      admin: {
        description:
          'Indicates if the custom domain should be used for middleware, url generation, sitemaps, etc. Uses the tenant slug subdomain if false.',
      },
    },
    {
      name: 'slug',
      type: 'text',
      admin: {
        description:
          'Used for subdomains and url paths for previews. This is a unique identifier for a tenant.',
      },
      index: true,
      required: true,
      unique: true,
    },
    contentHashField(),
  ],
}
