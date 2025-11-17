'use client'

import { EventTable } from '@/components/EventsTable'
import RichText from '@/components/RichText'
import type { Event, EventTableBlock as EventTableBlockProps } from '@/payload-types'
import { useTenant } from '@/providers/TenantProvider'
import { cn } from '@/utilities/ui'
import { useDynamicEvents } from './useDynamicEvents'

type EventTableComponentProps = EventTableBlockProps & {
  className?: string
}

export const EventTableBlockComponent = (args: EventTableComponentProps) => {
  const { heading, belowHeadingContent, className, eventOptions } = args
  const { filterByEventTypes, filterByEventGroups, filterByEventTags, maxEvents } =
    args.dynamicOptions || {}
  const { staticEvents } = args.staticOptions || {}

  const { tenant } = useTenant()
  const {
    events: fetchedEvents,
    loading,
    error,
  } = useDynamicEvents({
    tenant,
    filterByEventTypes,
    filterByEventGroups,
    filterByEventTags,
    maxEvents,
  })

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
