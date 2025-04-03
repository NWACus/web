import type { CollectionConfig } from 'payload'
import { accessByTenant } from '@/access/byTenant'
import { tenantField } from '@/fields/tenantField'
import { filterByTenant } from '@/access/filterByTenant'
import { titleFromTenantAndCollectionField } from '@/fields/titleFromTenantAndCollectionField'

export const Navigations: CollectionConfig = {
  slug: 'navigations',
  access: accessByTenant('navigations'),
  admin: {
    group: 'Navigation',
    // the GlobalViewRedirect will never allow a user to visit the list view of this collection but including this list filter as a precaution
    baseListFilter: filterByTenant,
    useAsTitle: 'titleFromTenantAndCollection',
  },
  fields: [
    tenantField({ unique: true }),
    titleFromTenantAndCollectionField,
    {
      name: 'items',
      type: 'relationship',
      hasMany: true,
      required: true,
      relationTo: ['navigationSections', 'pages'],
    },
    {
      name: 'weather_extra',
      type: 'relationship',
      hasMany: false,
      required: false,
      relationTo: ['navigationGroups'],
    },
    {
      name: 'about_us_extra',
      type: 'relationship',
      hasMany: true,
      required: false,
      relationTo: ['pages'],
    },
  ],
}
