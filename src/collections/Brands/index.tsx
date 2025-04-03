import type { CollectionConfig } from 'payload'
import { accessByTenant } from '@/access/byTenant'
import { filterByTenant } from '@/access/filterByTenant'
import { tenantField } from '@/fields/tenantField'
import { titleFromTenantAndCollectionField } from '@/fields/titleFromTenantAndCollectionField'

// A brand configures media, colors, etc for tenant.
export const Brands: CollectionConfig = {
  slug: 'brands',
  access: accessByTenant('brands'),
  admin: {
    // the GlobalViewRedirect will never allow a user to visit the list view of this collection but including this list filter as a precaution
    baseListFilter: filterByTenant,
    group: 'Branding',
    useAsTitle: 'titleFromTenantAndCollection',
  },
  fields: [
    tenantField({ unique: true }),
    titleFromTenantAndCollectionField,
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
