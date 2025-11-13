'use server'

import type { Event } from '@/payload-types'
import config from '@/payload.config'
import * as Sentry from '@sentry/nextjs'
import type { Where } from 'payload'
import { getPayload } from 'payload'

export interface GetEventsParams {
  offset?: number | null
  limit?: number | null
  types?: string[] | null
  startDate?: string | null
  endDate?: string | null
  groups?: string[] | null
  tags?: string[] | null
  modesOfTravel?: string[] | null
  center: string
}

export interface GetEventsResult {
  events: Event[]
  hasMore: boolean
  total: number
  error?: string
}

export async function getEvents(params: GetEventsParams): Promise<GetEventsResult> {
  const payload = await getPayload({ config })

  try {
    const { types, startDate, endDate, groups, tags, modesOfTravel, center } = params

    const offset = params.offset || 0
    const limit = params.limit || 10

    const conditions: Where[] = []

    conditions.push({
      'tenant.slug': {
        equals: center,
      },
    })

    if (types && types.length > 0) {
      conditions.push({
        type: {
          in: types,
        },
      })
    }

    if (groups && groups.length > 0) {
      conditions.push({
        eventGroups: {
          in: groups,
        },
      })
    }

    if (tags && tags.length > 0) {
      conditions.push({
        eventTags: {
          in: tags,
        },
      })
    }

    if (modesOfTravel && modesOfTravel.length > 0) {
      conditions.push({
        modeOfTravel: {
          in: modesOfTravel,
        },
      })
    }

    if (startDate && endDate) {
      conditions.push({
        startDate: {
          greater_than_equal: startDate,
          less_than_equal: endDate,
        },
      })
    } else if (startDate) {
      conditions.push({
        startDate: {
          greater_than_equal: startDate,
        },
      })
    } else if (endDate) {
      conditions.push({
        startDate: {
          less_than_equal: endDate,
        },
      })
    }

    const where: Where = conditions.length > 0 ? { and: conditions } : {}

    const result = await payload.find({
      collection: 'events',
      where,
      limit: limit || undefined,
      page: limit && offset ? Math.floor(offset / limit) + 1 : undefined,
      sort: 'startDate',
      depth: 2,
    })

    return {
      events: result.docs,
      hasMore: result.hasNextPage,
      total: result.totalDocs,
    }
  } catch (error) {
    payload.logger.error(error, 'Failed to getEvents')
    Sentry.captureException(error)
    return {
      events: [],
      hasMore: false,
      total: 0,
      error: 'Failed to load events. Please reload the page or clear your filters.',
    }
  }
}
