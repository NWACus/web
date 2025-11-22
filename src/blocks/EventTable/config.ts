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
  fields: [...defaultStylingFields(), ...dynamicEventRelatedFields(), ...staticEventRelatedFields],
}
