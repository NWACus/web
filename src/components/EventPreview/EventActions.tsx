import type { Event } from '@/payload-types'
import { ExternalLink } from 'lucide-react'
import { ButtonLink } from '../ButtonLink'
import { Button } from '../ui/button'

type ActionsEvent = Pick<Event, 'slug' | 'startDate' | 'registrationDeadline' | 'registrationUrl'>

function isRegistrationOpen({ startDate, registrationDeadline }: ActionsEvent): boolean {
  const now = new Date()
  const isPastEvent = startDate && new Date(startDate) < now
  const isRegistrationClosed = registrationDeadline && new Date(registrationDeadline) < now
  return !isPastEvent && !isRegistrationClosed
}

function RegisterButton({ event }: { event: ActionsEvent }) {
  if (!event.registrationUrl) return null
  if (!isRegistrationOpen(event)) {
    return (
      <Button
        className="group-hover:opacity-90 transition-opacity"
        size="sm"
        variant="default"
        disabled
      >
        Registration Closed
        <ExternalLink className="w-4 h-4 flex-shrink-0 ml-2 -mt-1.5 lg:-mt-0.5 text-muted" />
      </Button>
    )
  }
  return (
    <ButtonLink
      href={event.registrationUrl}
      size="sm"
      className="group-hover:opacity-90 transition-opacity"
      newTab
    >
      Register
      <ExternalLink className="w-4 h-4 flex-shrink-0 ml-2 -mt-1.5 lg:-mt-0.5 text-muted" />
    </ButtonLink>
  )
}

/** Register (or a closed notice) and Learn More, as an event card shows them. */
export function EventActions({ event, className }: { event: ActionsEvent; className?: string }) {
  return (
    <div className={className}>
      <RegisterButton event={event} />
      <ButtonLink
        href={`/events/${event.slug}`}
        variant="outline"
        size="sm"
        className="group-hover:opacity-90 transition-opacity"
      >
        Learn More
      </ButtonLink>
    </div>
  )
}
