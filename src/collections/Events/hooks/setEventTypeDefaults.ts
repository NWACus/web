import type { CollectionBeforeChangeHook } from 'payload'

import type { Event } from '@/payload-types'

export const setEventTypeDefaults: CollectionBeforeChangeHook<Event> = async ({
  data,
  req,
  operation,
}) => {
  // Only run on create or when event type changes
  if (operation === 'create' || (operation === 'update' && data.eventType)) {
    if (data.eventType) {
      let eventType

      // If eventType is just an ID, fetch the full object
      if (typeof data.eventType === 'string' || typeof data.eventType === 'number') {
        try {
          eventType = await req.payload.findByID({
            collection: 'event-types',
            id: data.eventType,
          })
        } catch (error) {
          req.payload.logger.warn('Could not fetch event type for defaults:', error)
          return data
        }
      } else {
        eventType = data.eventType
      }

      // Set skill rating defaults based on event type slug
      if (eventType?.slug && !data.skillRating) {
        switch (eventType.slug) {
          case 'avalanche-awareness':
            data.skillRating = '0' // Beginner Friendly
            break
          case 'workshop':
            data.skillRating = '1' // Previous Knowledge Helpful
            break
          case 'field-course':
            data.skillRating = '2' // Prerequisites Required
            break
          default:
            // Don't set a default for unknown types
            break
        }
      }
    }
  }

  return data
}
