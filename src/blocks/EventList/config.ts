import colorPickerField from '@/fields/color'
import {
  defaultStylingFields,
  dynamicEventRelatedFields,
  staticEventRelatedFields,
} from '@/fields/EventQuery/config'
import type { Block, Field } from 'payload'

const sortByField = (): Field => ({
  name: 'sortBy',
  type: 'select',
  defaultValue: 'startDate',
  options: [
    { label: 'Start Date (Earliest First)', value: 'startDate' },
    { label: 'Start Date (Latest First)', value: '-startDate' },
    { label: 'Registration Deadline (Earliest First)', value: 'registrationDeadline' },
    { label: 'Registration Deadline (Latest First)', value: '-registrationDeadline' },
  ],
  required: true,
  admin: {
    description: 'Select how the list of events will be sorted.',
  },
})

const eventListBlockWithFields = (fields: Field[]): Block => ({
  slug: 'eventList',
  interfaceName: 'EventListBlock',
  imageURL: '/thumbnail/EventListThumbnail.jpg',
  fields,
})

export const EventListBlock = eventListBlockWithFields([
  ...defaultStylingFields([colorPickerField('Background color')]),
  ...dynamicEventRelatedFields([sortByField()]),
  ...staticEventRelatedFields,
])

export const EventListBlockLexical = eventListBlockWithFields([
  ...defaultStylingFields([colorPickerField('Background color')]),
  {
    name: 'wrapInContainer',
    admin: {
      description:
        'Checking this will render the block with additional padding around it and using the background color you have selected.',
    },
    type: 'checkbox',
    defaultValue: false,
  },
  ...dynamicEventRelatedFields([sortByField()]),
  ...staticEventRelatedFields,
])
