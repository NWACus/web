'use client'

import { EventPreviewSmallRow } from '@/components/EventPreviewSmallRow'
import RichText from '@/components/RichText'
import { Button } from '@/components/ui/button'
import type { Event, EventListBlock as EventListBlockProps } from '@/payload-types'
import { useTenant } from '@/providers/TenantProvider'
import { filterValidPublishedRelationships } from '@/utilities/relationships'
import { cn } from '@/utilities/ui'
import { format } from 'date-fns'
import Link from 'next/link'
import { useEffect, useState } from 'react'

type EventListComponentProps = EventListBlockProps & {
  className?: string
  wrapInContainer?: boolean
}

export const EventListBlockComponent = (args: EventListComponentProps) => {
  const {
    heading,
    belowHeadingContent,
    backgroundColor,
    className,
    wrapInContainer = true,
    eventOptions,
  } = args

  const { filterByEventTypes, filterByEventGroups, filterByEventTags, maxEvents } =
    args.dynamicOptions || {}
  const { staticEvents } = args.staticOptions || {}

  const { tenant } = useTenant()
  const [fetchedEvents, setFetchedEvents] = useState<Event[]>([])
  const [eventParams, setEventParams] = useState<string>('')

  useEffect(() => {
    if (eventOptions !== 'dynamic') return

    const fetchEvents = async () => {
      const tenantSlug = typeof tenant === 'object' && tenant?.slug
      if (!tenantSlug) return

      const params = new URLSearchParams({
        center: tenantSlug,
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
      params.append('startDate', format(new Date(), 'MM-dd-yyyy'))
      setEventParams(params.toString())

      const response = await fetch(`/api/${tenantSlug}/events?${params.toString()}`, {
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch events')
      }

      const data = await response.json()
      setFetchedEvents(data.events || [])
    }

    fetchEvents()
  }, [eventOptions, filterByEventTypes, filterByEventGroups, filterByEventTags, maxEvents, tenant])

  let displayEvents: Event[] = filterValidPublishedRelationships(staticEvents)

  if (eventOptions === 'dynamic') {
    displayEvents = filterValidPublishedRelationships(fetchedEvents)
  }

  if (!displayEvents) {
    return null
  }

  const bgColorClass = `bg-${backgroundColor}`

  return (
    <div className={cn(wrapInContainer && bgColorClass && `${bgColorClass}`)}>
      <div className={cn(wrapInContainer && 'container py-10', '@container', className)}>
        <div className="bg-card text-card-foreground p-6 border shadow rounded-lg flex flex-col gap-6">
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
          <div
            className={cn(
              'grid gap-4 lg:gap-6 not-prose max-h-[400px] overflow-y-auto',
              displayEvents && displayEvents.length > 1 && '@3xl:grid-cols-2 @6xl:grid-cols-3',
            )}
          >
            {displayEvents && displayEvents?.length > 0 ? (
              displayEvents?.map((event, index) => (
                <EventPreviewSmallRow doc={event} key={`${event.id}__${index}`} />
              ))
            ) : (
              <h3>There are no events matching these results.</h3>
            )}
          </div>
          {eventOptions === 'static' && (
            <Button asChild className="not-prose md:self-start">
              <Link href={`/events?${eventParams}`}>View all {heading}</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
