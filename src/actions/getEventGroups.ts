'use server'

import config from '@/payload.config'
import * as Sentry from '@sentry/nextjs'
import { getPayload } from 'payload'

export interface GetEventGroupsParams {
  center: string
}

export interface GetEventGroupsResults {
  eventGroups: { label: string; value: string }[]
}

export async function getEventGroups(params: GetEventGroupsParams): Promise<GetEventGroupsResults> {
  try {
    const payload = await getPayload({ config })

    // Query all events for the center to get unique event groups
    const result = await payload.find({
      collection: 'events',
      limit: 10000,
      where: {
        'tenant.slug': {
          equals: params.center,
        },
      },
      select: {
        eventGroups: true,
      },
    })

    // Extract unique event group IDs
    const uniqueGroupIds = new Set<number>()
    result.docs.forEach((doc) => {
      if (doc.eventGroups && Array.isArray(doc.eventGroups)) {
        doc.eventGroups.forEach((group) => {
          if (typeof group === 'number') {
            uniqueGroupIds.add(group)
          } else if (group && typeof group === 'object' && 'id' in group) {
            uniqueGroupIds.add(group.id)
          }
        })
      }
    })

    if (uniqueGroupIds.size === 0) {
      return { eventGroups: [] }
    }

    // Fetch the actual event group documents
    const groupsResult = await payload.find({
      collection: 'eventGroups',
      where: {
        id: {
          in: Array.from(uniqueGroupIds),
        },
      },
      limit: 1000,
    })

    // Map to label/value format
    const eventGroups = groupsResult.docs.map((group) => ({
      label: group.title,
      value: String(group.id),
    }))

    return { eventGroups }
  } catch (error) {
    Sentry.captureException(error)
    return { eventGroups: [] }
  }
}
