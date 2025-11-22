import { RowField } from 'payload'

export const startAndEndDateField = (): RowField => ({
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
})
