import { accessByProviderRelationship } from '@/access/byProviderRelationship'
import { stateOptions } from '@/blocks/Form/State/options'
import { contentHashField } from '@/fields/contentHashField'
import { slugField } from '@/fields/slug'
import { validatePhone } from '@/utilities/validatePhone'
import { validateWebsite } from '@/utilities/validateWebsite'
import { validateZipCode } from '@/utilities/validateZipCode'
import { CollectionConfig } from 'payload'
import { eventSubTypesData } from '../Events/constants'
import { courseTypesFieldAccess } from './access/courseTypesFieldAccess'
import { setToken } from './hooks/SetToken'
import { revalidateProvider, revalidateProviderDelete } from './hooks/revalidateProvider'
import { sendProviderEmails } from './hooks/sendProviderEmails'

export const Providers: CollectionConfig = {
  slug: 'providers',
  access: accessByProviderRelationship,
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
      name: 'events',
      type: 'join',
      collection: 'events',
      on: 'provider',
    },
    {
      type: 'group',
      label: 'Application Information',
      fields: [
        {
          name: 'experience',
          type: 'textarea',
          label: 'Experience & Certifications',
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'courseTypesAppliedFor',
          label: 'Course Types Applied For',
          type: 'select',
          hasMany: true,
          admin: {
            description:
              'These are the course types this provider has applied to be able to create.',
            readOnly: true,
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
      options: eventSubTypesData
        .filter((subType) => subType.eventType === 'course-by-external-provider')
        .map((eventSubType) => ({
          label: eventSubType.label,
          value: eventSubType.value,
        })),
    },
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
    afterChange: [sendProviderEmails, revalidateProvider],
    afterDelete: [revalidateProviderDelete],
  },
  versions: {
    drafts: {
      autosave: true,
    },
    maxPerDoc: 10,
  },
}
