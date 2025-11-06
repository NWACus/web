import { accessByProviderRelationship } from '@/access/byProviderRelationship'
import { contentHashField } from '@/fields/contentHashField'
import { stateOptions } from '@/fields/location/states'
import { slugField } from '@/fields/slug'
import { validatePhone } from '@/utilities/validatePhone'
import { validateWebsite } from '@/utilities/validateWebsite'
import { validateZipCode } from '@/utilities/validateZipCode'
import { CollectionConfig } from 'payload'
import { courseTypesData } from '../Courses/constants'
import { courseTypesFieldAccess } from './access/courseTypesFieldAccess'
import { sendProviderEmails } from './hooks/sendProviderEmails'

export const Providers: CollectionConfig = {
  slug: 'providers',
  access: accessByProviderRelationship,
  admin: {
    useAsTitle: 'name',
    group: 'Courses',
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
      type: 'group',
      label: 'Contact Information',
      fields: [
        {
          name: 'email',
          type: 'email',
        },
        {
          name: 'phone',
          type: 'text',
          validate: validatePhone,
        },
        {
          name: 'website',
          type: 'text',
          validate: validateWebsite,
        },
      ],
    },
    {
      name: 'location',
      type: 'group',
      fields: [
        {
          name: 'address',
          type: 'text',
          label: 'Street Address',
          admin: {
            condition: (_data, siblingData) => !siblingData?.isVirtual,
          },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'city',
              type: 'text',
              label: 'City',
              admin: {
                condition: (_data, siblingData) => !siblingData?.isVirtual,
              },
            },
            {
              name: 'state',
              type: 'select',
              label: 'State',
              options: stateOptions,
              required: true,
              admin: {
                condition: (_data, siblingData) => !siblingData?.isVirtual,
              },
            },
            {
              name: 'zip',
              type: 'text',
              label: 'ZIP Code',
              validate: validateZipCode,
              admin: {
                condition: (_data, siblingData) => !siblingData?.isVirtual,
              },
            },
          ],
        },
        {
          name: 'country',
          type: 'select',
          options: [{ label: 'United States - US', value: 'US' }],
          label: 'Country',
          defaultValue: 'US',
          admin: {
            condition: (_data, siblingData) => !siblingData?.isVirtual,
            readOnly: true,
          },
        },
      ],
    },
    {
      name: 'courses',
      type: 'join',
      collection: 'courses',
      on: 'provider',
    },
    slugField('name'),
    {
      name: 'courseTypes',
      label: 'Approved Course Types',
      type: 'select',
      hasMany: true,
      access: courseTypesFieldAccess,
      required: true,
      admin: {
        description: 'These are the course types this provider is approved to create.',
        position: 'sidebar',
      },
      options: courseTypesData.map((courseType) => ({
        label: courseType.label,
        value: courseType.value,
      })),
    },
    contentHashField(),
  ],
  hooks: {
    afterChange: [sendProviderEmails],
  },
  versions: {
    drafts: {
      autosave: true,
    },
    maxPerDoc: 10,
  },
}
