import type { CollectionConfig } from 'payload'
import { uniqueTenantField } from '@/fields/TenantField'
import { accessByTenant } from '@/access/byTenant'
import { filterByTenant } from '@/access/filterByTenant'

// A brand configures media, colors, etc for tenant.
export const Brands: CollectionConfig = {
  slug: 'brands',
  access: accessByTenant('brands'),
  admin: {
    // baseListFilter: filterByTenant,
    group: 'Branding',
  },
  fields: [
    // uniqueTenantField,
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Media',
          description: 'Brand media to be shown on your website.',
          fields: [
            {
              name: 'logo',
              label: 'Logo',
              type: 'upload',
              relationTo: 'media',
              required: true,
            },
            {
              name: 'banner',
              label: 'Banner',
              type: 'upload',
              relationTo: 'media',
              required: true,
            },
          ],
        },
        {
          label: 'Theme',
          description: 'Theming options for your website.',
          fields: [
            {
              name: 'theme',
              type: 'relationship',
              hasMany: false,
              relationTo: 'themes',
              required: true,
            },
          ],
        },
      ],
    },
  ],
}
