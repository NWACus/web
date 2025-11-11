import type { Block } from 'payload'
import {
  defaultStylingFields,
  dynamicEventRelatedFields,
  staticEventRelatedFields,
} from '../EventQuery/config'

export const EventTableBlock: Block = {
  slug: 'eventTable',
  interfaceName: 'EventTableBlock',
  imageURL: '/thumbnail/EventTableThumbnail.jpg',
  fields: [...defaultStylingFields(), ...dynamicEventRelatedFields(), ...staticEventRelatedFields],
}
