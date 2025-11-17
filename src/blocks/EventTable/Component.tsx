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
  const { heading, belowHeadingContent, className, eventOptions } = args
  const { filterByEventTypes, filterByEventGroups, filterByEventTags, maxEvents } =
    args.dynamicOptions || {}
  const { staticEvents } = args.staticOptions || {}

  const { tenant } = useTenant()
  const [fetchedEvents, setFetchedEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (eventOptions !== 'dynamic') return

    const fetchEvents = async () => {
      try {
        setLoading(true)
        setError(null)

        const tenantId = typeof tenant === 'number' ? tenant : (tenant as { id?: number })?.id
        if (!tenantId) return

        const params = new URLSearchParams({
          tenantId: String(tenantId),
          limit: String(maxEvents || 4),
          depth: '1',
        })

        if (filterByEventTypes?.length) {
          params.append('types', filterByEventTypes.join(','))
        }

        if (filterByEventGroups?.length) {
          const groupIds = filterByEventGroups
            .map((g) => (typeof g === 'object' ? g.id : g))
            .filter(Boolean)
          if (groupIds.length) {
            params.append('groups', groupIds.join(','))
          }
        }

        if (filterByEventTags?.length) {
          const tagIds = filterByEventTags
            .map((t) => (typeof t === 'object' ? t.id : t))
            .filter(Boolean)
          if (tagIds.length) {
            params.append('tags', tagIds.join(','))
          }
        }

        const response = await fetch(`/api/eventsQuery?${params.toString()}`, {
          cache: 'no-store',
        })

        if (!response.ok) {
          throw new Error('Failed to fetch events')
        }

        const data = await response.json()
        setFetchedEvents(data.docs || [])
      } catch (err) {
        console.error('[EventTable Error]:', err)
        setError(err instanceof Error ? err.message : 'An error occurred while fetching events')
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [eventOptions, filterByEventTypes, filterByEventGroups, filterByEventTags, maxEvents, tenant])

  let displayEvents
  if (eventOptions === 'static') displayEvents = staticEvents as Event[]
  if (eventOptions === 'dynamic') displayEvents = fetchedEvents

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
