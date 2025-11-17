import config from '@/payload.config'
import * as Sentry from '@sentry/nextjs'
import { getPayload } from 'payload'

export interface GetEventTagsParams {
  center: string
}

export interface GetEventTagsResults {
  eventTags: { label: string; value: string }[]
}

export async function getEventTags({ center }: GetEventTagsParams): Promise<GetEventTagsResults> {
  try {
    const payload = await getPayload({ config })

    // Query all events for the center to get unique event tags
    const result = await payload.find({
      collection: 'eventTags',
      where: {
        and: [
          {
            'tenant.slug': {
              equals: center,
            },
          },
          {
            'events.id': {
              exists: true,
            },
          },
          {
            'events._status': {
              equals: 'published',
            },
          },
        ],
      },
      pagination: false,
      select: {
        title: true,
        slug: true,
      },
      sort: 'title',
    })

    const eventTags = result.docs.map(({ title, slug }) => ({
      label: title,
      value: slug,
    }))

    return { eventTags }
  } catch (error) {
    Sentry.captureException(error)
    return { eventTags: [] }
  }
}
