import colorPickerField from '@/fields/color'
import {
  defaultStylingFields,
  dynamicEventRelatedFields,
  staticEventRelatedFields,
} from '@/fields/EventQuery/config'
import type { Block, Field } from 'payload'

const eventListBlockWithFields = (fields: Field[]): Block => ({
  slug: 'eventList',
  interfaceName: 'EventListBlock',
  imageURL: '/thumbnail/EventListThumbnail.jpg',
  fields,
})

export const EventListBlock = eventListBlockWithFields([
  ...defaultStylingFields([colorPickerField('Background color')]),
  ...dynamicEventRelatedFields(),
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
  ...dynamicEventRelatedFields(),
  ...staticEventRelatedFields,
])
