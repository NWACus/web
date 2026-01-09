import { accessByProviderRelationship } from '@/access/byProviderRelationship'
import { courseTypesData } from '@/constants/courseTypes'
import { contentHashField } from '@/fields/contentHashField'
import { stateOptions } from '@/fields/location/states'
import { slugField } from '@/fields/slug'
import { validatePhone } from '@/utilities/validatePhone'
import { validateExternalUrl } from '@/utilities/validateUrl'
import { validateZipCode } from '@/utilities/validateZipCode'
import { CollectionConfig } from 'payload'
import { courseTypesFieldAccess } from './access/courseTypesFieldAccess'
import { revalidateProvider, revalidateProviderDelete } from './hooks/revalidateProvider'
import { sendProviderEmails } from './hooks/sendProviderEmails'
import { setNotificationEmail } from './hooks/setNotificationEmail'

export const Providers: CollectionConfig = {
  slug: 'providers',
  access: accessByProviderRelationship,
  admin: {
    useAsTitle: 'name',
    group: 'Courses',
    description: 'Note: This information will be displayed on your public provider listing.',
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
      admin: {
        description: 'Note: This information will be displayed on your public provider listing.',
      },
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
          validate: validateExternalUrl,
        },
      ],
    },
    {
      name: 'location',
      type: 'group',
      admin: {
        description: "Your organization's business address.",
      },
      fields: [
        {
          name: 'address',
          type: 'text',
          label: 'Street Address',
        },
        {
          type: 'row',
          fields: [
            {
              name: 'city',
              type: 'text',
              label: 'City',
            },
            {
              name: 'state',
              type: 'select',
              label: 'State',
              options: stateOptions,
            },
            {
              name: 'zip',
              type: 'text',
              label: 'ZIP Code',
              validate: validateZipCode,
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
            readOnly: true,
          },
        },
      ],
    },
    {
      type: 'group',
      label: 'States you offer courses in',
      admin: {
        description:
          'Include all of the states you offer courses in. This will be used when displaying your provider in our list by state.',
      },
      fields: [
        {
          name: 'statesServiced',
          label: false,
          type: 'select',
          options: stateOptions,
          required: true,
          hasMany: true,
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
      name: 'notificationEmail',
      type: 'email',
      admin: {
        description:
          'This email will be used for email notifications. Defaults to the contact email if not specified.',
        position: 'sidebar',
      },
      hooks: {
        beforeChange: [setNotificationEmail],
      },
    },
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
    afterChange: [sendProviderEmails, revalidateProvider],
    afterDelete: [revalidateProviderDelete],
  },
  versions: {
    drafts: true,
    maxPerDoc: 10,
  },
}
