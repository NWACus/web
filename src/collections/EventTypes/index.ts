import { accessByGlobalRoleWithAuthenticatedRead } from '@/access/byGlobalRole'
import { contentHashField } from '@/fields/contentHashField'
import { slugField } from '@/fields/slug'
import { CollectionConfig } from 'payload'

export const EventTypes: CollectionConfig = {
  slug: 'eventTypes',
  access: accessByGlobalRoleWithAuthenticatedRead('eventTypes'),
  admin: {
    group: 'Content',
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
      type: 'group',
      fields: [
        {
          name: 'crmId',
          label: 'CRM ID',
          type: 'text',
          admin: {
            description: "Maps this type to it's associated representation in the CRM Integration",
          },
        },
        {
          name: 'crmIntegration',
          label: 'CRM Integration',
          type: 'select',
          options: [
            { label: 'AC Salesforce', value: 'ac-salesforce' },
            { label: 'A3 CRM', value: 'a3-crm' },
          ],
        },
      ],
    },
    slugField(),
    contentHashField(),
  ],
}
