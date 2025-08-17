import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { EventGroup } from '@/payload-types'

export type EventsByGroupProps = {
  className?: string
  title?: string | null
  eventGroups: (number | EventGroup)[]
  limit?: number | null
  showFutureOnly?: boolean | null
  layout?: ('grid' | 'list') | null
  id?: string | null
  blockName?: string | null
  blockType: 'events-by-group'
}

export const EventsByGroupBlockComponent = async (props: EventsByGroupProps) => {
  const { title, eventGroups, limit = 6, showFutureOnly = true, layout = 'grid' } = props

  const payload = await getPayload({ config: configPromise })

  // Get tenant from the event groups to filter events
  const firstGroup = eventGroups?.[0]
  const tenant =
    typeof firstGroup === 'object' && firstGroup?.tenant
      ? typeof firstGroup.tenant === 'object'
        ? firstGroup.tenant
        : null
      : null

  if (!tenant || !eventGroups?.length) {
    return null
  }

  // Build where clause for events query
  const whereClause: any = {
    _status: {
      equals: 'published',
    },
    'tenant.slug': {
      equals: tenant.slug,
    },
    'eventGroups.id': {
      in: eventGroups.map((group) => (typeof group === 'object' ? group.id : group)),
    },
  }

  // Add future-only filter if enabled
  if (showFutureOnly) {
    whereClause.startDate = {
      greater_than_equal: new Date().toISOString(),
    }
  }

  const events = await payload.find({
    collection: 'events',
    depth: 2,
    limit: limit || 6,
    where: whereClause,
    sort: 'startDate',
  })

  if (!events.docs || events.docs.length === 0) {
    return null
  }

  return (
    <div className="container my-16">
      {title && <h2 className="mb-8 text-3xl font-bold">{title}</h2>}

      <div
        className={
          layout === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-6'
        }
      >
        {events.docs.map((event) => (
          <div key={event.id} className="border rounded-lg p-6 bg-white shadow-sm">
            {event.featuredImage &&
              typeof event.featuredImage === 'object' &&
              event.featuredImage.url && (
                <div className="mb-4">
                  <img
                    src={event.featuredImage.url}
                    alt={event.featuredImage.alt || ''}
                    className="w-full h-48 object-cover rounded"
                  />
                </div>
              )}

            <div className="space-y-3">
              <h3 className="text-xl font-semibold">{event.title}</h3>

              {event.excerpt && <p className="text-gray-600">{event.excerpt}</p>}

              <div className="text-sm text-gray-500">
                {event.startDate && (
                  <time dateTime={event.startDate}>
                    {new Date(event.startDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                {event.registrationUrl && (
                  <a
                    href={event.registrationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
                  >
                    Register
                  </a>
                )}

                <a
                  href={event.externalEventUrl || `/${tenant.slug}/events/${event.slug}`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-50 transition-colors"
                  {...(event.externalEventUrl
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : {})}
                >
                  More Info
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
