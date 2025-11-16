'use client'

import { EventTable } from '@/components/EventsTable'
import RichText from '@/components/RichText'
import type { Event, EventTableBlock as EventTableBlockProps } from '@/payload-types'
import { useTenant } from '@/providers/TenantProvider'
import { cn } from '@/utilities/ui'
import { useEffect, useState } from 'react'

type EventTableComponentProps = EventTableBlockProps & {
  className?: string
}

export const EventTableBlockComponent = (args: EventTableComponentProps) => {
  const { heading, belowHeadingContent, className } = args
  const {
    filterByEventTypes,
    filterByEventGroups,
    filterByEventTags,
    showUpcomingOnly,
    maxEvents,
  } = args.dynamicOptions || {}
  const { staticEvents } = args.staticOptions || {}

  const [events, setEvents] = useState<Event[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { tenant } = useTenant()

  const eventsLinkQueryParams = new URLSearchParams()

  if (filterByEventTypes && filterByEventTypes.length > 0) {
    eventsLinkQueryParams.set('types', filterByEventTypes.join(','))
  }

  // Fetch dynamic events
  useEffect(() => {
    const shouldFetchDynamic =
      !staticEvents ||
      (staticEvents.length === 0 &&
        (filterByEventTypes?.length || filterByEventGroups?.length || filterByEventTags?.length))

    if (!shouldFetchDynamic) {
      setLoading(false)
      return
    }

    const fetchEvents = async () => {
      try {
        setLoading(true)
        setError(null)

        const tenantId = typeof tenant === 'number' ? tenant : (tenant as { id?: number })?.id
        if (!tenantId) return

        const params = new URLSearchParams({
          limit: String(maxEvents || 4),
          depth: '1',
          'where[tenant][equals]': String(tenantId),
        })

        if (filterByEventTypes && filterByEventTypes.length > 0) {
          params.append('where[type][in]', filterByEventTypes.join(','))
        }

        if (filterByEventGroups && filterByEventGroups.length > 0) {
          const groupIds = filterByEventGroups
            .map((g) => (typeof g === 'object' ? g.id : g))
            .filter(Boolean)
          if (groupIds.length > 0) {
            params.append('where[groups][in]', groupIds.join(','))
          }
        }

        if (filterByEventTags && filterByEventTags.length > 0) {
          const tagIds = filterByEventTags
            .map((t) => (typeof t === 'object' ? t.id : t))
            .filter(Boolean)
          if (tagIds.length > 0) {
            params.append('where[tags][in]', tagIds.join(','))
          }
        }

        if (showUpcomingOnly) {
          params.append('where[startDate][greater_than]', new Date().toISOString())
        }

        const response = await fetch(`/api/events?${params.toString()}`, {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
          cache: 'no-store', // Add this
        })
        if (!response.ok) {
          throw new Error('Failed to fetch events')
        }

        const data = await response.json()
        setEvents(data.docs)
      } catch (err) {
        console.error('[EventTable Error]:', err)
        setError(err instanceof Error ? err.message : 'An error occurred while fetching events')
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [
    filterByEventTypes,
    filterByEventGroups,
    filterByEventTags,
    showUpcomingOnly,
    maxEvents,
    staticEvents,
    tenant,
  ])

  // Use static events if available, otherwise use fetched events
  const displayEvents =
    staticEvents?.filter((event): event is Event => typeof event === 'object' && event !== null) ??
    events

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
        {(loading || error) && (
          <div className="flex items-center justify-center py-8">
            {loading && <p className="text-muted-foreground">Loading events...</p>}
            {error && <p className="text-destructive">Error loading events: {error}</p>}
          </div>
        )}
        {displayEvents && displayEvents.length > 0 ? (
          <EventTable events={displayEvents} />
        ) : (
          <h3>There are no events matching these results.</h3>
        )}
      </div>
    </div>
  )
}
