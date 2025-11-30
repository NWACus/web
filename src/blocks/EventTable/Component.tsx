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
  const { byTypes, byGroups, byTags, maxEvents } = args.dynamicOpts || {}
  const { staticEvents } = args.staticOpts || {}

  const { tenant } = useTenant()
  const [fetchedEvents, setFetchedEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (eventOptions !== 'dynamic') return

    const fetchEvents = async () => {
      try {
        setError(null)

        const tenantSlug = typeof tenant === 'object' && tenant?.slug
        if (!tenantSlug) return

        const params = new URLSearchParams({
          center: tenantSlug,
          limit: String(maxEvents || 4),
          depth: '1',
        })

        if (byTypes?.length) {
          params.append('types', byTypes.join(','))
        }

        if (byGroups?.length) {
          const groupIds = byGroups.map((g) => (typeof g === 'object' ? g.id : g)).filter(Boolean)
          if (groupIds.length) {
            params.append('groups', groupIds.join(','))
          }
        }

        if (byTags?.length) {
          const tagIds = byTags.map((t) => (typeof t === 'object' ? t.id : t)).filter(Boolean)
          if (tagIds.length) {
            params.append('tags', tagIds.join(','))
          }
        }
        params.append('startDate', format(new Date(), 'MM-dd-yyyy'))

        const response = await fetch(`/api/${tenantSlug}/events?${params.toString()}`, {
          cache: 'no-store',
        })

        if (!response.ok) {
          throw new Error('Failed to fetch events')
        }

        const data = await response.json()
        setFetchedEvents(data.events || [])
      } catch (err) {
        console.error('[EventTable Error]:', err)
        setError(err instanceof Error ? err.message : 'An error occurred while fetching events')
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [eventOptions, byTypes, byGroups, byTags, maxEvents, tenant])

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
        {loading || error ? (
          <div className="flex items-center justify-center py-8">
            {loading && <p className="text-muted-foreground">Loading events...</p>}
            {error && <p className="text-destructive">Error loading events: {error}</p>}
          </div>
        ) : (
          <EventTable events={displayEvents} />
        )}
      </div>
    </div>
  )
}
