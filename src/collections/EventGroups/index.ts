import { accessByGlobalRoleWithAuthenticatedRead } from '@/access/byGlobalRole'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { slugField } from '@/fields/slug'
import { tenantField } from '@/fields/tenantField'
import { CollectionConfig } from 'payload'

export const EventGroups: CollectionConfig = {
  slug: 'eventGroups',
  access: accessByGlobalRoleWithAuthenticatedRead('eventGroups'),
  admin: {
    baseListFilter: filterByTenant,
    group: 'Events',
    useAsTitle: 'title',
  },
  fields: [
    tenantField(),
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    slugField(),
    contentHashField(),
  ],
}
