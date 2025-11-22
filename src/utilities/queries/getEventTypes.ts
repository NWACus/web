import { EventType, eventTypesData } from '@/constants/eventTypes'
import config from '@/payload.config'
import * as Sentry from '@sentry/nextjs'
import { getPayload } from 'payload'

export interface GetEventTypesParams {
  center: string
}

export interface GetEventTypesResults {
  eventTypes: EventType[]
}

export async function getEventTypes(params: GetEventTypesParams): Promise<GetEventTypesResults> {
  try {
    const payload = await getPayload({ config })

    const result = await payload.findDistinct({
      collection: 'events',
      where: {
        and: [
          {
            'tenant.slug': {
              equals: params.center,
            },
          },
          {
            type: {
              exists: true,
            },
          },
        ],
      },
      field: 'type',
    })

    const typeSlugs = result.values.map(({ type }) => type)
    const eventTypes = eventTypesData.filter((eventType) => typeSlugs.includes(eventType.value))

    return { eventTypes }
  } catch (error) {
    Sentry.captureException(error)
    return { eventTypes: [] }
  }
}
