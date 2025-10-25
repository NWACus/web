import { accessByGlobalRoleWithAuthenticatedRead } from '@/access/byGlobalRole'
import { contentHashField } from '@/fields/contentHashField'
import { slugField } from '@/fields/slug'
import { CollectionConfig } from 'payload'

export const EventSeries: CollectionConfig = {
  slug: 'eventSeries',
  access: accessByGlobalRoleWithAuthenticatedRead('eventSeries'),
  admin: {
    group: 'Events',
    useAsTitle: 'title',
  },
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
    slugField(),
    contentHashField(),
  ],
}
