'use client'

import type { Event } from '@/payload-types'
import type { GetEventsResult } from '@/utilities/queries/getEvents'
import { EventPreview } from './EventPreview'
import { InfiniteList } from './InfiniteList'

const FILTER_KEYS = ['types', 'startDate', 'endDate', 'groups', 'tags', 'modesOfTravel'] as const

const eventsOf = (result: GetEventsResult) => result.events

interface EventsListProps {
  initialEvents: Event[]
  initialHasMore: boolean
  initialError?: string
  center: string
}

export const EventsList = ({
  initialEvents,
  initialHasMore,
  initialError,
  center,
}: EventsListProps) => (
  <InfiniteList
    initialItems={initialEvents}
    initialHasMore={initialHasMore}
    initialError={initialError}
    endpoint={`/api/${center}/events`}
    filterKeys={FILTER_KEYS}
    itemsOf={eventsOf}
    itemsLabel="events"
    className="@container"
    renderItem={(event) => (
      <div className="mb-8" key={event.id}>
        <EventPreview className="h-full" event={event} />
      </div>
    )}
  />
)
