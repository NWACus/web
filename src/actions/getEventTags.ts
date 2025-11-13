'use server'

import config from '@/payload.config'
import * as Sentry from '@sentry/nextjs'
import { getPayload } from 'payload'

export interface GetEventTagsParams {
  center: string
}

export interface GetEventTagsResults {
  eventTags: { label: string; value: string }[]
}

export async function getEventTags(params: GetEventTagsParams): Promise<GetEventTagsResults> {
  try {
    const payload = await getPayload({ config })

    // Query all events for the center to get unique event tags
    const result = await payload.find({
      collection: 'events',
      limit: 10000,
      where: {
        'tenant.slug': {
          equals: params.center,
        },
      },
      select: {
        eventTags: true,
      },
    })

    // Extract unique event tag IDs
    const uniqueTagIds = new Set<number>()
    result.docs.forEach((doc) => {
      if (doc.eventTags && Array.isArray(doc.eventTags)) {
        doc.eventTags.forEach((tag) => {
          if (typeof tag === 'number') {
            uniqueTagIds.add(tag)
          } else if (tag && typeof tag === 'object' && 'id' in tag) {
            uniqueTagIds.add(tag.id)
          }
        })
      }
    })

    if (uniqueTagIds.size === 0) {
      return { eventTags: [] }
    }

    // Fetch the actual event tag documents
    const tagsResult = await payload.find({
      collection: 'eventTags',
      where: {
        id: {
          in: Array.from(uniqueTagIds),
        },
      },
      limit: 1000,
    })

    // Map to label/value format
    const eventTags = tagsResult.docs.map((tag) => ({
      label: tag.title,
      value: String(tag.id),
    }))

    return { eventTags }
  } catch (error) {
    Sentry.captureException(error)
    return { eventTags: [] }
  }
}
