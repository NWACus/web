import { accessByGlobalRoleWithAuthenticatedRead } from '@/access/byGlobalRole'
import { contentHashField } from '@/fields/contentHashField'
import { crmFields } from '@/fields/crmFields'
import { slugField } from '@/fields/slug'
import { CollectionConfig } from 'payload'

export const EventSubTypes: CollectionConfig = {
  slug: 'eventSubTypes',
  access: accessByGlobalRoleWithAuthenticatedRead('eventSubTypes'),
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
    {
      name: 'eventType',
      admin: {
        description: 'The parent event type for this sub type',
      },
      type: 'relationship',
      relationTo: 'eventTypes',
      required: true,
    },
    crmFields(),
    slugField(),
    contentHashField(),
  ],
}
