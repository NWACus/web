import { contentHashField } from '@/fields/contentHashField'
import { locationField } from '@/fields/location'
import { slugField } from '@/fields/slug'
import { populatePublishedAt } from '@/hooks/populatePublishedAt'
import { TIMEZONE_OPTIONS } from '@/utilities/timezones'
import { CollectionConfig } from 'payload'
import { accessByProviderOrProviderManager } from './access/byProviderOrProviderManager'
import { courseTypesData } from './constants'

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
    {
      type: 'row',
      fields: [
        {
          name: 'startDate',
          type: 'date',
          required: true,
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
            width: '50%',
          },
        },
        {
          name: 'endDate',
          type: 'date',
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
            description: 'Optional end date for multi-day events',
            width: '50%',
          },
          validate: (value, { siblingData }) => {
            const data = siblingData as { startDate?: string | Date }
            if (value && data?.startDate) {
              const startDate = new Date(data.startDate)
              const endDate = new Date(value)

              if (endDate <= startDate) {
                return 'End date must be after start date.'
              }
            }
            return true
          },
        },
      ],
    },
    {
      name: 'timezone',
      type: 'select',
      options: TIMEZONE_OPTIONS,
      admin: {
        description: 'Event timezone',
      },
    },
    locationField(),
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
      validate: (value, { siblingData }) => {
        const data = siblingData as { startDate?: string | Date }
        if (value && data?.startDate) {
          const registrationDeadline = new Date(value)
          const startDate = new Date(data.startDate)

          if (registrationDeadline >= startDate) {
            return 'Registration deadline must be before start date.'
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
    {
      name: 'modeOfTravel',
      type: 'select',
      options: [
        { label: 'Ski', value: 'ski' },
        { label: 'Splitboard', value: 'splitboard' },
        { label: 'Motorized', value: 'motorized' },
        { label: 'Snowshoe', value: 'snowshoe' },
      ],
      hasMany: true,
      admin: {
        position: 'sidebar',
      },
    },
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
