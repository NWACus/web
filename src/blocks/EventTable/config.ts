import colorPickerField from '@/fields/color'
import {
  defaultStylingFields,
  dynamicEventRelatedFields,
  staticEventRelatedFields,
} from '@/fields/EventQuery/config'
import type { Block } from 'payload'

export const EventTableBlock: Block = {
  slug: 'eventTable',
  interfaceName: 'EventTableBlock',
  imageURL: '/thumbnail/EventTableThumbnail.jpg',
  fields: [
    ...defaultStylingFields([colorPickerField('Background color')]),
    ...dynamicEventRelatedFields(),
    ...staticEventRelatedFields,
  ],
}
