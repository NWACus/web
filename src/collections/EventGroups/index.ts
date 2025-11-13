import { accessByTenantRole } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { slugField } from '@/fields/slug'
import { tenantField } from '@/fields/tenantField'
import { CollectionConfig } from 'payload'

export const EventGroups: CollectionConfig = {
  slug: 'eventGroups',
  access: accessByTenantRole('eventGroups'),
  admin: {
    baseListFilter: filterByTenant,
    group: 'Events',
    useAsTitle: 'title',
  },
  fields: [
    tenantField(),
    {
      type: 'group',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          type: 'textarea',
        },
      ],
    },
    slugField(),
    contentHashField(),
  ],
}
