import { accessByTenantRole } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { slugField } from '@/fields/slug'
import { tenantField } from '@/fields/tenantField'
import { titleField } from '@/fields/title'
import { CollectionConfig } from 'payload'

export const EventTags: CollectionConfig = {
  slug: 'eventTags',
  access: accessByTenantRole('eventTags'),
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
      on: 'eventTags',
    },
    slugField(),
    contentHashField(),
  ],
}
