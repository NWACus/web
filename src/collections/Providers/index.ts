import { accessByGlobalRole } from '@/access/byGlobalRole'
import { contentHashField } from '@/fields/contentHashField'
import { coreLocationFields } from '@/fields/location'
import { slugField } from '@/fields/slug'
import { CollectionConfig } from 'payload'
import { eventSubTypesData } from '../Events/constants'
import { setToken } from './hooks/SetToken'

export const Providers: CollectionConfig = {
  slug: 'providers',
  access: accessByGlobalRole('providers'),
  admin: {
    useAsTitle: 'name',
    group: 'Events',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'details',
      type: 'textarea',
    },
    {
      name: 'location',
      type: 'group',
      fields: coreLocationFields,
    },
    {
      type: 'group',
      label: 'accreditations',
      fields: [
        {
          name: 'courseTypes',
          label: 'Approved Course Types',
          type: 'select',
          admin: {
            description: 'These are the course types this provider is approved to create.',
          },
          options: eventSubTypesData
            .filter((subType) => subType.eventType === 'course-by-external-provider')
            .map((eventSubType) => ({
              label: eventSubType.label,
              value: eventSubType.value,
            })),
        },
      ],
    },
    {
      name: 'events',
      type: 'join',
      collection: 'events',
      on: 'provider',
    },
    slugField('name'),
    {
      name: 'managementLink',
      type: 'ui',
      admin: {
        components: {
          Field: '@/collections/Providers/components/ManagementLink#ManagementLink',
        },
        position: 'sidebar',
      },
    },
    {
      name: 'token',
      type: 'text',
      index: true,
      admin: {
        hidden: true,
      },
    },
    contentHashField(),
  ],
  hooks: {
    beforeChange: [setToken],
  },
  versions: true,
}
