import { EVENTS_LIMIT } from '@/constants/defaults'
import type { Event } from '@/payload-types'
import config from '@/payload.config'
import { nearestFirst, type BoundingBox, type LatLng } from '@/utilities/geo/distance'
import { withinBoxWhere } from '@/utilities/geo/where'
import * as Sentry from '@sentry/nextjs'
import { format } from 'date-fns'
import type { Payload, Where } from 'payload'
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
  /** Only events held inside this box, e.g. the map area a reader searched. */
  box?: BoundingBox | null
  /** Sorts the events nearest this point first, with virtual and unplaced events last. */
  near?: LatLng | null
  center: string
}

export interface GetEventsResult {
  events: Event[]
  hasMore: boolean
  total: number
  error?: string
}

/** Where an event is held, or nothing for a virtual event, which never goes on the map. */
const placeOf = (event: Pick<Event, 'location'>) =>
  event.location?.isVirtual ? null : event.location?.coordinates

/**
 * The database can't sort by distance on SQLite, so this loads every matching event's location,
 * sorts them here, and only fully loads the page being shown.
 */
async function findNearestEvents(
  payload: Payload,
  where: Where,
  near: LatLng,
  offset: number,
  limit: number,
): Promise<GetEventsResult> {
  const { docs: located } = await payload.find({
    collection: 'events',
    where,
    pagination: false,
    sort: 'startDate',
    depth: 0,
    select: { location: { isVirtual: true, coordinates: true } },
  })
  const pageIds = nearestFirst(located, near, placeOf)
    .slice(offset, offset + limit)
    .map((event) => event.id)
  const { docs } = await payload.find({
    collection: 'events',
    where: { id: { in: pageIds } },
    pagination: false,
    depth: 2,
  })
  const byId = new Map(docs.map((event) => [event.id, event]))
  return {
    events: pageIds.flatMap((id) => byId.get(id) ?? []),
    hasMore: offset + limit < located.length,
    total: located.length,
  }
}

export async function getEvents(params: GetEventsParams): Promise<GetEventsResult> {
  const payload = await getPayload({ config })

  try {
    const { types, startDate, endDate, groups, tags, modesOfTravel, box, near, center } = params

    const offset = Math.max(0, Math.floor(Number(params.offset)) || 0)
    const limit = Math.max(0, Math.floor(Number(params.limit))) || EVENTS_LIMIT

    const conditions: Where[] = [
      {
        'tenant.slug': {
          equals: center,
        },
      },
      {
        _status: {
          equals: 'published',
        },
      },
    ]

    if (types && types.length > 0) {
      conditions.push({
        type: {
          in: types,
        },
      })
    }

    if (groups && groups.length > 0) {
      conditions.push({
        'eventGroups.slug': {
          in: groups,
        },
      })
    }

    if (tags && tags.length > 0) {
      conditions.push({
        'eventTags.slug': {
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
    } else if (!startDate && !endDate) {
      conditions.push({
        startDate: {
          greater_than_equal: format(new Date(), 'MM-dd-yyyy'),
        },
      })
    }

    if (box) {
      // Saving as virtual clears the point; this also covers rows written around the hook.
      conditions.push(withinBoxWhere('location.coordinates', box), {
        'location.isVirtual': { not_equals: true },
      })
    }

    const where: Where = conditions.length > 0 ? { and: conditions } : {}

    if (near) return await findNearestEvents(payload, where, near, offset, limit)

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
