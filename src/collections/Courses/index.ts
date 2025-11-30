import { courseTypesData } from '@/constants/courseTypes'
import { affinityGroupField } from '@/fields/affinityGroupField'
import { contentHashField } from '@/fields/contentHashField'
import { coordinatesWithMap } from '@/fields/location/coordinatesWithMap'
import { stateOptions } from '@/fields/location/states'
import { modeOfTravelField } from '@/fields/modeOfTravelField'
import { slugField } from '@/fields/slug'
import { startAndEndDateField } from '@/fields/startAndEndDateField'
import { populatePublishedAt } from '@/hooks/populatePublishedAt'
import { Course } from '@/payload-types'
import { TIMEZONE_OPTIONS } from '@/utilities/timezones'
import { validateZipCode } from '@/utilities/validateZipCode'
import { CollectionConfig } from 'payload'
import { accessByProviderOrProviderManager } from './access/byProviderOrProviderManager'

export const Courses: CollectionConfig = {
  slug: 'courses',
  access: accessByProviderOrProviderManager,
  admin: {
    group: 'Courses',
    defaultColumns: ['title', 'subtitle', 'featuredImage', 'startDate', 'updatedAt'],
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'subtitle',
      type: 'text',
      admin: {
        description: 'Optional subtitle/tagline for the event',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Short description/summary for event previews',
      },
    },
    startAndEndDateField(),
    {
      name: 'timezone',
      type: 'select',
      options: TIMEZONE_OPTIONS,
      admin: {
        description: 'Event timezone',
      },
    },
    {
      name: 'location',
      type: 'group',
      fields: [
        {
          name: 'placeName',
          type: 'text',
          label: 'Place Name',
          required: true,
        },
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
              required: true,
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
        ...coordinatesWithMap({
          condition: (_data, siblingData) => !siblingData?.isVirtual,
        }),
      ],
    },
    {
      name: 'courseUrl',
      type: 'text',
      admin: {
        description: 'External registration link or landing page link',
      },
    },
    {
      name: 'registrationDeadline',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        description: 'Registration cutoff',
      },
      validate: (value, { siblingData }: { siblingData: Partial<Course> }) => {
        const data = siblingData
        if (value && data?.startDate) {
          const registrationDeadline = new Date(value)
          const startDate = new Date(data.startDate)

          if (registrationDeadline >= startDate) {
            return `Registration deadline must be before start date. ${registrationDeadline} ${startDate}`
          }
        }
        return true
      },
    },
    // Sidebar
    slugField(),
    {
      name: 'courseType',
      type: 'select',
      required: true,
      admin: {
        position: 'sidebar',
        components: {
          Field: '@/collections/Courses/components/CourseTypeField#CourseTypeField',
        },
      },
      options: courseTypesData.map((courseType) => ({
        label: courseType.label,
        value: courseType.value,
      })),
    },
    modeOfTravelField(),
    affinityGroupField(),
    {
      name: 'provider',
      type: 'relationship',
      defaultValue: ({ user }) => {
        // Set provider to their first provider if a provider user
        if (user?.providers && Array.isArray(user.providers)) {
          const providerId =
            typeof user.providers[0] === 'number' ? user.providers[0] : user.providers[0]?.id
          return providerId
        }
        return undefined
      },
      admin: {
        allowCreate: false,
        allowEdit: false,
        position: 'sidebar',
      },
      hasMany: false,
      index: true,
      relationTo: 'providers',
      filterOptions: ({ user }) => {
        // If user has provider relationships, only show those providers
        if (user?.providers && Array.isArray(user.providers) && user.providers.length > 0) {
          const providerIds = user.providers
            .map((provider) => (typeof provider === 'number' ? provider : provider?.id))
            .filter((id): id is number => typeof id === 'number')

          if (providerIds.length > 0) {
            return {
              id: {
                in: providerIds,
              },
            }
          }
        }

        // Otherwise, show all providers (for users with global roles)
        return true
      },
    },
    contentHashField(),
  ],
  hooks: {
    beforeChange: [populatePublishedAt],
    // TODO: need revalidation hooks here
  },
  versions: {
    drafts: {
      autosave: true,
    },
    maxPerDoc: 10,
  },
}
