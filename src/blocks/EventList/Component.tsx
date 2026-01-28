'use client'

import { ButtonLink } from '@/components/ButtonLink'
import { EventPreviewSmallRow } from '@/components/EventPreviewSmallRow'
import RichText from '@/components/RichText'
import type { Event, EventListBlock as EventListBlockProps } from '@/payload-types'
import { useTenant } from '@/providers/TenantProvider'
import { filterValidPublishedRelationships } from '@/utilities/relationships'
import { cn } from '@/utilities/ui'
import { format } from 'date-fns'
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

  const { byTypes, byGroups, byTags, maxEvents } = args.dynamicOpts || {}
  const { staticEvents } = args.staticOpts || {}

  const { tenant } = useTenant()
  const [fetchedEvents, setFetchedEvents] = useState<Event[]>([])
  const [eventsPageParamsString, setEventsPageParamsString] = useState<string>('')

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
      setEventsPageParamsString(eventsPageParams.toString())

      const allParams = new URLSearchParams([...params, ...eventsPageParams])

      const response = await fetch(`/api/${tenantSlug}/events?${allParams.toString()}`, {
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch events')
      }

      const data = await response.json()
      setFetchedEvents(data.events || [])
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
          {eventOptions === 'dynamic' && (
            <ButtonLink
              href={`/events?${eventsPageParamsString}`}
              className="not-prose md:self-start"
            >
              View all {heading}
            </ButtonLink>
          )}
        </div>
      </div>
    </div>
  )
}
