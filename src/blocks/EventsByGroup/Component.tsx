import configPromise from '@payload-config'
import { getPayload, type Where } from 'payload'

import { EventCard } from '@/components/EventCard'
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
  const whereClause: Where = {
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
          <EventCard
            key={event.id}
            event={event}
            variant={layout === 'list' ? 'horizontal' : 'vertical'}
            showGroup={false}
            showType={true}
            showDate={true}
          />
        ))}
      </div>
    </div>
  )
}
