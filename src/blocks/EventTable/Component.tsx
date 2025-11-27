'use client'

import { EventTable } from '@/components/EventsTable'
import RichText from '@/components/RichText'
import type { Event, EventTableBlock as EventTableBlockProps } from '@/payload-types'
import { useTenant } from '@/providers/TenantProvider'
import { filterValidPublishedRelationships } from '@/utilities/relationships'
import { cn } from '@/utilities/ui'
import { format } from 'date-fns'
import { useEffect, useState } from 'react'

type EventTableComponentProps = EventTableBlockProps & {
  className?: string
}

export const EventTableBlockComponent = (args: EventTableComponentProps) => {
  const { heading, belowHeadingContent, className, eventOptions } = args
  const { filterByEventTypes, filterByEventGroups, filterByEventTags, maxEvents } =
    args.dynamicOptions || {}
  const { staticEvents } = args.staticOptions || {}

  const { tenant } = useTenant()
  const [fetchedEvents, setFetchedEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [eventsPageParams, setEventsPageParams] = useState<string>('')

  useEffect(() => {
    if (eventOptions !== 'dynamic') return

    const fetchEvents = async () => {
      const tenantSlug = typeof tenant === 'object' && tenant?.slug
      if (!tenantSlug) return

      const params = new URLSearchParams({
        limit: String(maxEvents || 4),
      })

      // params supported by the events page
      const eventsPageParams = new URLSearchParams()

      if (filterByEventTypes?.length) {
        eventsPageParams.append('types', filterByEventTypes.join(','))
      }

      if (filterByEventGroups?.length) {
        const groupIds = filterByEventGroups
          .map((g) => (typeof g === 'object' ? g.id : g))
          .filter(Boolean)
        if (groupIds.length) {
          eventsPageParams.append('groups', groupIds.join(','))
        }
      }

      if (filterByEventTags?.length) {
        const tagIds = filterByEventTags
          .map((t) => (typeof t === 'object' ? t.id : t))
          .filter(Boolean)
        if (tagIds.length) {
          eventsPageParams.append('tags', tagIds.join(','))
        }
      }
      eventsPageParams.append('startDate', format(new Date(), 'MM-dd-yyyy'))
      setEventsPageParams(eventsPageParams.toString())

      const allParams = new URLSearchParams([...params, ...eventsPageParams])

      const response = await fetch(`/api/${tenantSlug}/events?${allParams.toString()}`, {
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch events')
      }

      const data = await response.json()
      setFetchedEvents(data.events || [])

      setLoading(false)
    }

    fetchEvents()
  }, [
    eventOptions,
    filterByEventTypes,
    filterByEventGroups,
    filterByEventTags,
    maxEvents,
    tenant,
    eventsPageParams,
  ])

  let displayEvents: Event[] = filterValidPublishedRelationships(staticEvents)

  if (eventOptions === 'dynamic') {
    displayEvents = filterValidPublishedRelationships(fetchedEvents)
  }

  if (!displayEvents) {
    return null
  }

  return (
    <div className={cn('container', className)}>
      <div className="flex flex-col justify-start gap-1">
        {heading && (
          <div className="prose md:prose-md dark:prose-invert">
            <h2>{heading}</h2>
          </div>
        )}
        {belowHeadingContent && (
          <div>
            <RichText data={belowHeadingContent} enableGutter={false} />
          </div>
        )}
      </div>
      <div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            {loading && <p className="text-muted-foreground">Loading events...</p>}
          </div>
        ) : (
          <EventTable events={displayEvents} />
        )}
      </div>
    </div>
  )
}
