import { accessByGlobalRoleWithAuthenticatedRead } from '@/access/byGlobalRole'
import { contentHashField } from '@/fields/contentHashField'
import { slugField } from '@/fields/slug'
import { CollectionConfig } from 'payload'

export const EventTags: CollectionConfig = {
  slug: 'eventTags',
  access: accessByGlobalRoleWithAuthenticatedRead('eventTags'),
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
