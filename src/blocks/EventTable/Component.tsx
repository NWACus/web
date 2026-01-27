'use client'

import { BackgroundColorWrapper } from '@/components/BackgroundColorWrapper'
import { EventTable } from '@/components/EventsTable'
import RichText from '@/components/RichText'
import type { Event, EventTableBlock as EventTableBlockProps } from '@/payload-types'
import { useTenant } from '@/providers/TenantProvider'
import { filterValidPublishedRelationships } from '@/utilities/relationships'
import { cn } from '@/utilities/ui'
import { format } from 'date-fns'
import { useEffect, useState } from 'react'

type EventTableComponentProps = EventTableBlockProps & {
  wrapInContainer: boolean
  className?: string
}

export const EventTableBlockComponent = (args: EventTableComponentProps) => {
  const {
    heading,
    belowHeadingContent,
    className,
    eventOptions,
    backgroundColor,
    wrapInContainer = true,
  } = args
  const { byTypes, byGroups, byTags, maxEvents } = args.dynamicOpts || {}
  const { staticEvents } = args.staticOpts || {}

  const { tenant } = useTenant()
  const [fetchedEvents, setFetchedEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  let displayEvents: Event[] = filterValidPublishedRelationships(staticEvents)

  useEffect(() => {
    if (eventOptions !== 'dynamic') {
      setLoading(false)
      return
    }

    const fetchEvents = async () => {
      const tenantSlug = typeof tenant === 'object' && tenant?.slug
      if (!tenantSlug) return

      const params = new URLSearchParams({
        limit: String(maxEvents || 4),
      })

      // params supported by the events page
      const eventsPageParams = new URLSearchParams()

      if (byTypes?.length) {
        eventsPageParams.append('types', byTypes.join(','))
      }

      if (byGroups?.length) {
        const groupSlugs = byGroups
          .map((g) => (typeof g === 'object' ? g.slug : null))
          .filter(Boolean)
        if (groupSlugs.length) {
          eventsPageParams.append('groups', groupSlugs.join(','))
        }
      }

      if (byTags?.length) {
        const tagSlugs = byTags.map((t) => (typeof t === 'object' ? t.slug : null)).filter(Boolean)
        if (tagSlugs.length) {
          eventsPageParams.append('tags', tagSlugs.join(','))
        }
      }
      eventsPageParams.append('startDate', format(new Date(), 'MM-dd-yyyy'))

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
  }, [eventOptions, byTypes, byGroups, byTags, maxEvents, tenant, staticEvents, fetchedEvents])

  if (eventOptions === 'dynamic') {
    displayEvents = filterValidPublishedRelationships(fetchedEvents)
  }

  if (!displayEvents) {
    return null
  }

  return (
    <BackgroundColorWrapper
      backgroundColor={backgroundColor}
      wrapInContainer={wrapInContainer}
      containerClassName={className}
    >
      <div className={cn('container bg-card text-card-foreground p-6 rounded-lg', className)}>
        <div className="flex flex-col justify-start gap-1">
          {heading && (
            <div className="prose md:prose-md dark:prose-invert">
              <h2>{heading}</h2>
            </div>
          )}
          {belowHeadingContent && (
            <div className="mb-4">
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
    </BackgroundColorWrapper>
  )
}
