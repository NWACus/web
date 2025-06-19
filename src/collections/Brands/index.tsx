import { accessByTenant } from '@/access/byTenant'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { tenantField } from '@/fields/tenantField'
import type { CollectionConfig } from 'payload'

// A brand configures media, colors, etc for tenant.
export const Brands: CollectionConfig = {
  slug: 'brands',
  access: accessByTenant('brands'),
  admin: {
    // the GlobalViewRedirect will never allow a user to visit the list view of this collection but including this list filter as a precaution
    baseListFilter: filterByTenant,
    group: 'Branding',
  },
  fields: [
    tenantField({ unique: true }),
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
      ],
    },
    contentHashField(),
  ],
}
