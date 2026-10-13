'use client'

import type { Event } from '@/payload-types'
import type { GetEventsResult } from '@/utilities/queries/getEvents'
import { useSearchParams } from 'next/navigation'
import { Fragment } from 'react'
import { EventPreview } from './EventPreview'
import { distanceLabel, pointOf } from './EventsMap/eventPlaces'
import { serverNearQuery, useNearOrigin, type NearOrigin } from './EventsMap/useNearOrigin'
import { InfiniteList } from './InfiniteList'

const FILTER_KEYS = ['types', 'startDate', 'endDate', 'groups', 'tags', 'modesOfTravel'] as const

const eventsOf = (result: GetEventsResult) => result.events

interface EventsListProps {
  initialEvents: Event[]
  initialHasMore: boolean
  initialError?: string
  center: string
}

/** Where the shown events were sorted from, once they're the ones loaded for `origin`. */
const sortedFrom = (origin: NearOrigin | null, loadedQuery: string) =>
  origin && new URLSearchParams(loadedQuery).get('near') === origin.query ? origin.point : null

/** Sorted by distance, virtual and unplaced events come last, under their own heading. */
const startsUnplaced = (events: Event[], index: number) =>
  !pointOf(events[index]) && (index === 0 || pointOf(events[index - 1]) !== null)

export const EventsList = ({
  initialEvents,
  initialHasMore,
  initialError,
  center,
}: EventsListProps) => {
  const searchParams = useSearchParams()
  const origin = useNearOrigin()
  return (
    <InfiniteList
      initialItems={initialEvents}
      initialHasMore={initialHasMore}
      initialError={initialError}
      endpoint={`/api/${center}/events`}
      filterKeys={FILTER_KEYS}
      // The device location never reaches the server, so the first page arrives soonest first
      // and is refetched once the location is read from the session.
      filters={{ near: origin?.query ?? '' }}
      initialFilters={{ near: serverNearQuery(searchParams.get('near')) }}
      itemsOf={eventsOf}
      itemsLabel="events"
      className="@container"
      renderItem={(event, index, { items, loadedQuery }) => {
        const from = sortedFrom(origin, loadedQuery)
        return (
          <Fragment key={event.id}>
            {from && startsUnplaced(items, index) && (
              <h3 className="mb-4 text-sm font-semibold text-muted-foreground">
                Online & no location
              </h3>
            )}
            <div className="mb-8">
              <EventPreview
                className="h-full"
                event={event}
                distance={distanceLabel(event, from)}
              />
            </div>
          </Fragment>
        )
      }}
    />
  )
}
