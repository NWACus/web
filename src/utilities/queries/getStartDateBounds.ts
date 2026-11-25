import config from '@/payload.config'
import * as Sentry from '@sentry/nextjs'
import type { Where } from 'payload'
import { getPayload } from 'payload'

export type StartDateBounds = {
  earliest: string | null
  latest: string | null
}

const NO_BOUNDS: StartDateBounds = { earliest: null, latest: null }

const published: Where = { _status: { equals: 'published' } }

async function findStartDateBounds(
  collection: 'events' | 'courses',
  where: Where,
): Promise<StartDateBounds> {
  try {
    const payload = await getPayload({ config })
    const findEdge = (sort: string) =>
      payload.find({
        collection,
        where,
        sort,
        limit: 1,
        depth: 0,
        pagination: false,
        select: { startDate: true },
      })

    const [first, last] = await Promise.all([findEdge('startDate'), findEdge('-startDate')])

    return {
      earliest: first.docs[0]?.startDate ?? null,
      latest: last.docs[0]?.startDate ?? null,
    }
  } catch (error) {
    Sentry.captureException(error)
    return NO_BOUNDS
  }
}

export function getEventsStartDateBounds({ center }: { center: string }) {
  return findStartDateBounds('events', { and: [{ 'tenant.slug': { equals: center } }, published] })
}

export function getCoursesStartDateBounds() {
  return findStartDateBounds('courses', published)
}
