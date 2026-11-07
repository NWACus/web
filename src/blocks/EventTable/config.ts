import colorPickerField from '@/fields/color'
import {
  defaultStylingFields,
  dynamicEventRelatedFields,
  staticEventRelatedFields,
} from '@/fields/EventQuery/config'
import { layoutField } from '@/fields/layout'
import type { Block } from 'payload'

export const EventTableBlock: Block = {
  slug: 'eventTable',
  interfaceName: 'EventTableBlock',
  imageURL: '/thumbnail/EventTableThumbnail.jpg',
  fields: [
    ...defaultStylingFields(),
    ...dynamicEventRelatedFields(),
    ...staticEventRelatedFields,
    layoutField([colorPickerField('Background color')]),
  ],
}
