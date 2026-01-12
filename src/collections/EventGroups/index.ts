import { accessByTenantRole } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { slugField } from '@/fields/slug'
import { tenantField } from '@/fields/tenantField'
import { titleField } from '@/fields/title'
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
    titleField(),
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'events',
      type: 'join',
      collection: 'events',
      on: 'eventGroups',
    },
    slugField(),
    contentHashField(),
  ],
}
