'use server'

import { eventTypesData } from '@/constants/eventTypes'
import config from '@/payload.config'
import * as Sentry from '@sentry/nextjs'
import { getPayload } from 'payload'

export interface GetEventTypesParams {
  center: string
}

export interface GetEventTypesResults {
  eventTypes: { label: string; value: string; description?: string | null }[]
}

export async function getEventTypes(params: GetEventTypesParams): Promise<GetEventTypesResults> {
  try {
    const payload = await getPayload({ config })

    // Query all events for the center to get unique event types
    const result = await payload.find({
      collection: 'events',
      limit: 10000,
      where: {
        'tenant.slug': {
          equals: params.center,
        },
      },
      select: {
        type: true,
      },
    })

    // Extract unique event type values
    const uniqueTypes = new Set<string>()
    result.docs.forEach((doc) => {
      if (doc.type) {
        uniqueTypes.add(doc.type)
      }
    })

    // Filter eventTypesData to only include types that are actually used
    const eventTypes = eventTypesData.filter((eventType) => uniqueTypes.has(eventType.value))

    return { eventTypes }
  } catch (error) {
    Sentry.captureException(error)
    return { eventTypes: [] }
  }
}
