import { EventPreviewSmallRow } from '@/components/EventPreviewSmallRow'
import RichText from '@/components/RichText'
import { Button } from '@/components/ui/button'
import type {
  Event,
  EventListBlock as EventListBlockProps,
  EventSubType,
  EventType,
} from '@/payload-types'
import { cn } from '@/utilities/ui'
import Link from 'next/link'

type EventListComponentProps = EventListBlockProps & {
  className?: string
  wrapInContainer?: boolean
}

export const EventListBlockComponent = async (args: EventListComponentProps) => {
  const { heading, belowHeadingContent, backgroundColor, className, wrapInContainer = true } = args

  const { filterByEventTypes, filterByEventSubTypes, sortBy, queriedEvents } =
    args.dynamicOptions || {}
  const { staticEvents } = args.staticOptions || {}

  let events = staticEvents?.filter(
    (event): event is Event => typeof event === 'object' && event !== null,
  )

  const hasStaticEvents = staticEvents && staticEvents.length > 0

  if (!staticEvents || (staticEvents.length === 0 && queriedEvents && queriedEvents.length > 0)) {
    events = queriedEvents?.filter(
      (event): event is Event => typeof event === 'object' && event !== null,
    )
  }

  const filterByEventTypesSlugs = filterByEventTypes
    ?.filter((type): type is EventType => typeof type === 'object' && type !== null)
    .map((type) => (typeof type.id === 'string' ? type.id : String(type.id)))

  const filterByEventSubTypesSlugs = filterByEventSubTypes
    ?.filter((subType): subType is EventSubType => typeof subType === 'object' && subType !== null)
    .map((subType) => (typeof subType.id === 'string' ? subType.id : String(subType.id)))

  const eventsLinkQueryParams = new URLSearchParams()
  if (sortBy !== undefined) {
    eventsLinkQueryParams.set('sort', sortBy)
  }

  if (filterByEventTypesSlugs && filterByEventTypesSlugs.length > 0) {
    eventsLinkQueryParams.set('types', filterByEventTypesSlugs.join(','))
  }

  if (filterByEventSubTypesSlugs && filterByEventSubTypesSlugs.length > 0) {
    eventsLinkQueryParams.set('subtypes', filterByEventSubTypesSlugs.join(','))
  }

  if (!events) {
    return null
  }

  const bgColorClass = `bg-${backgroundColor}`

  return (
    <div className={cn(wrapInContainer && bgColorClass)}>
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
              events && events.length > 1 && '@3xl:grid-cols-2 @6xl:grid-cols-3',
            )}
          >
            {events && events?.length > 0 ? (
              events?.map((event, index) => (
                <EventPreviewSmallRow doc={event} key={`${event.id}__${index}`} />
              ))
            ) : (
              <h3>There are no events matching these results.</h3>
            )}
          </div>
          {!hasStaticEvents && (
            <Button asChild className="not-prose md:self-start">
              <Link href={`/events?${eventsLinkQueryParams.toString()}`}>View all {heading}</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
