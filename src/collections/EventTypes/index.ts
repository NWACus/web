import { accessByGlobalRoleWithAuthenticatedRead } from '@/access/byGlobalRole'
import { contentHashField } from '@/fields/contentHashField'
import { crmFields } from '@/fields/crmFields'
import { slugField } from '@/fields/slug'
import { CollectionConfig } from 'payload'

export const EventTypes: CollectionConfig = {
  slug: 'eventTypes',
  access: accessByGlobalRoleWithAuthenticatedRead('eventTypes'),
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
    crmFields(),
    slugField(),
    contentHashField(),
  ],
}
