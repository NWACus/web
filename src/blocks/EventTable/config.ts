import colorPickerField from '@/fields/color'
import {
  defaultStylingFields,
  dynamicEventRelatedFields,
  staticEventRelatedFields,
} from '@/fields/EventQuery/config'
import type { Block, Field } from 'payload'

const eventTableBlockWithFields = (fields: Field[]): Block => ({
  slug: 'eventTable',
  interfaceName: 'EventTableBlock',
  imageURL: '/thumbnail/EventTableThumbnail.jpg',
  fields,
})

export const EventTableBlock = eventTableBlockWithFields([
  ...defaultStylingFields([colorPickerField('Background color')]),
  ...dynamicEventRelatedFields(),
  ...staticEventRelatedFields,
])

export const EventTableLexicalBlock = eventTableBlockWithFields([
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
