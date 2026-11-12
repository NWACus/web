import colorPickerField from '@/fields/color'
import {
  defaultStylingFields,
  dynamicEventRelatedFields,
  staticEventRelatedFields,
} from '@/fields/EventQuery/config'
import { layoutField } from '@/fields/layout'
import type { Block } from 'payload'

export const EventListBlock: Block = {
  slug: 'eventList',
  interfaceName: 'EventListBlock',
  imageURL: '/thumbnail/EventListThumbnail.jpg',
  fields: [
    ...defaultStylingFields(),
    ...dynamicEventRelatedFields(),
    ...staticEventRelatedFields,
    layoutField([colorPickerField('Background color')]),
  ],
}
