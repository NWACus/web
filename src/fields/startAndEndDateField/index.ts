import { TIMEZONE_OPTIONS } from '@/utilities/timezones'
import { DateField, RowField, ValidateOptions } from 'payload'
import { date } from 'payload/shared'

interface EventFormData {
  startDate?: string | Date
  endDate?: string | Date
}

export const startAndEndDateField = (): RowField => ({
  type: 'row',
  fields: [
    {
      name: 'startDate',
      type: 'date',
      timezone: {
        supportedTimezones: TIMEZONE_OPTIONS,
      },
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
      timezone: {
        supportedTimezones: TIMEZONE_OPTIONS,
        required: true,
      },
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        description:
          'Optional end date for multi-day events. Timezone will always be set to the startDate timezone.',
        width: '50%',
      },
      validate: (
        value,
        args: ValidateOptions<unknown, unknown, DateField, Date> & {
          siblingData: Partial<EventFormData>
        },
      ) => {
        const { siblingData } = args
        if (value && siblingData?.startDate) {
          const startDate = new Date(siblingData.startDate)
          const endDate = new Date(value)

          if (endDate <= startDate) {
            return 'End date must be after start date.'
          }
        }

        return date(value, args)
      },
    },
    {
      type: 'ui',
      name: 'initialTimezoneSetter',
      admin: {
        components: {
          Field:
            '@/fields/startAndEndDateField/components/InitialTimezoneSetter#InitialTimezoneSetter',
        },
      },
    },
  ],
})
