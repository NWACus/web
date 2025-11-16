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

export async function getEventGroups({
  center,
}: GetEventGroupsParams): Promise<GetEventGroupsResults> {
  try {
    const payload = await getPayload({ config })

    const result = await payload.find({
      collection: 'eventGroups',
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

    const eventGroups = result.docs.map(({ title, slug }) => ({
      label: title,
      value: slug,
    }))

    return { eventGroups }
  } catch (error) {
    Sentry.captureException(error)
    return { eventGroups: [] }
  }
}
