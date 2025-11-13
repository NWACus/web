import { EventTable } from '@/components/EventsTable'
import RichText from '@/components/RichText'
import type { Event, EventTableBlock as EventTableBlockProps } from '@/payload-types'
import { cn } from '@/utilities/ui'

type EventTableComponentProps = EventTableBlockProps & {
  className?: string
}

export const EventTableBlockComponent = async (args: EventTableComponentProps) => {
  const { heading, belowHeadingContent, className } = args

  const { filterByEventTypes, queriedEvents } = args.dynamicOptions || {}
  const { staticEvents } = args.staticOptions || {}

  let events = staticEvents?.filter(
    (event): event is Event => typeof event === 'object' && event !== null,
  )

  if (!staticEvents || (staticEvents.length === 0 && queriedEvents && queriedEvents.length > 0)) {
    events = queriedEvents?.filter(
      (event): event is Event => typeof event === 'object' && event !== null,
    )
  }

  const eventsLinkQueryParams = new URLSearchParams()

  if (filterByEventTypes && filterByEventTypes.length > 0) {
    eventsLinkQueryParams.set('types', filterByEventTypes.join(','))
  }

  if (!events) {
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
        {events && events?.length > 0 ? (
          <EventTable events={events} />
        ) : (
          <h3>There are no events matching these results.</h3>
        )}
      </div>
    </div>
  )
}
