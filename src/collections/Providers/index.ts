import { accessByGlobalRole } from '@/access/byGlobalRole'
import { contentHashField } from '@/fields/contentHashField'
import { coreLocationFields } from '@/fields/location'
import { slugField } from '@/fields/slug'
import { CollectionConfig } from 'payload'
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
      name: 'location',
      type: 'group',
      fields: coreLocationFields,
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
}
