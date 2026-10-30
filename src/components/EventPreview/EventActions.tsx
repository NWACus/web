import type { Event } from '@/payload-types'
import { ExternalLink } from 'lucide-react'
import { ButtonLink } from '../ButtonLink'
import { Button } from '../ui/button'

type ActionsEvent = Pick<Event, 'slug' | 'startDate' | 'registrationDeadline' | 'registrationUrl'>

/** Full size on an event card; compact in the events map's narrow list. */
const SIZES = {
  default: {
    button: 'group-hover:opacity-90 transition-opacity',
    icon: 'w-4 h-4 flex-shrink-0 ml-2 -mt-1.5 lg:-mt-0.5 text-muted',
  },
  compact: { button: 'h-8 px-3 text-xs', icon: 'h-3.5 w-3.5 flex-shrink-0 ml-1.5 text-muted' },
}

type ActionsSize = keyof typeof SIZES

function isRegistrationOpen({ startDate, registrationDeadline }: ActionsEvent): boolean {
  const now = new Date()
  const isPastEvent = startDate && new Date(startDate) < now
  const isRegistrationClosed = registrationDeadline && new Date(registrationDeadline) < now
  return !isPastEvent && !isRegistrationClosed
}

function RegisterButton({ event, size }: { event: ActionsEvent; size: ActionsSize }) {
  const { button, icon } = SIZES[size]
  if (!event.registrationUrl) return null
  if (!isRegistrationOpen(event)) {
    return (
      <Button className={button} size="sm" variant="default" disabled>
        Registration Closed
        <ExternalLink className={icon} />
      </Button>
    )
  }
  return (
    <ButtonLink href={event.registrationUrl} size="sm" className={button} newTab>
      Register
      <ExternalLink className={icon} />
    </ButtonLink>
  )
}

/** Register (or a closed notice) and Learn More, as an event card shows them. */
export function EventActions({
  event,
  size = 'default',
  className,
}: {
  event: ActionsEvent
  size?: ActionsSize
  className?: string
}) {
  return (
    <div className={className}>
      <RegisterButton event={event} size={size} />
      <ButtonLink
        href={`/events/${event.slug}`}
        variant="outline"
        size="sm"
        className={SIZES[size].button}
      >
        Learn More
      </ButtonLink>
    </div>
  )
}
