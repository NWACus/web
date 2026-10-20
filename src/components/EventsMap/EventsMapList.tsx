'use client'

import { EventInfo } from '@/components/EventInfo'
import { EventActions } from '@/components/EventPreview/EventActions'
import { ImageMedia } from '@/components/Media/ImageMedia'
import { eventTypesData } from '@/constants/eventTypes'
import type { Event } from '@/payload-types'
import { formatDateTime } from '@/utilities/formatDateTime'
import type { LatLng } from '@/utilities/geo/distance'
import { isValidRelationship } from '@/utilities/relationships'
import { cn } from '@/utilities/ui'
import { ChevronDown, Loader2, MapPin, X } from 'lucide-react'
import Link from 'next/link'
import { useId, useState } from 'react'
import { describeWhere, distanceLabel, placeKeyFor, pointOf } from './eventPlaces'
import type { EventsState } from './useAllFilteredEvents'

/** What a card needs from the map's selection: its highlight, and a way to show its pin. */
export type CardSelection = {
  hover: (key: string | null) => void
  isSelected: (key: string | null) => boolean
  showOnMap: (key: string) => void
}

function eventMeta(event: Event, from: LatLng | null): string {
  const typeLabel = eventTypesData.find((type) => type.value === event.type)?.label
  const when = formatDateTime(event.startDate, event.startDate_tz, 'EEE, MMM d · h:mm a')
  const distance = distanceLabel(event, from)
  return [typeLabel, when, distance].filter(Boolean).join(' · ')
}

function ShowOnMapButton({
  placeKey,
  title,
  selection,
}: {
  placeKey: string | null
  title: string
  selection: CardSelection
}) {
  if (!placeKey) return null
  return (
    <button
      type="button"
      // Starts with the visible label, then names the event, since every card repeats the button.
      aria-label={`Show on map: ${title}`}
      onClick={() => selection.showOnMap(placeKey)}
      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
    >
      <MapPin className="h-3.5 w-3.5" /> Show on map
    </button>
  )
}

function EventThumbnail({ event }: { event: Event }) {
  if (!isValidRelationship(event.thumbnailImage)) return null
  return (
    // The title links to the same page, so this one stays out of the tab order.
    <Link href={`/events/${event.slug}`} tabIndex={-1} aria-hidden className="shrink-0">
      <ImageMedia
        resource={event.thumbnailImage}
        pictureClassName="block h-16 w-16 overflow-hidden rounded"
        imgClassName="h-full w-full object-cover"
        sizes="64px"
      />
    </Link>
  )
}

/** The rest of what the list view shows: subtitle, description, full dates and skill level. */
function EventDetails({ event, id }: { event: Event; id: string }) {
  return (
    <div id={id} className="mt-2 flex flex-col gap-2 text-sm">
      {event.subtitle && <p className="font-medium">{event.subtitle}</p>}
      {event.description && (
        <p className="text-muted-foreground line-clamp-4">{event.description}</p>
      )}
      <EventInfo
        startDate={event.startDate}
        startDate_tz={event.startDate_tz}
        endDate={event.endDate}
        skillLevel={event.skillLevel}
        className="flex flex-col gap-1"
      />
    </div>
  )
}

function DetailsToggle({
  expanded,
  controls,
  title,
  onToggle,
}: {
  expanded: boolean
  controls: string
  title: string
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      aria-label={`Details: ${title}`}
      aria-expanded={expanded}
      aria-controls={controls}
      onClick={onToggle}
      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
    >
      Details
      <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', expanded && 'rotate-180')} />
    </button>
  )
}

export type CardsProps = { selection: CardSelection; distanceFrom: LatLng | null }

function EventMapCard({ event, selection, distanceFrom }: CardsProps & { event: Event }) {
  const key = placeKeyFor(event)
  const detailsId = useId()
  const [expanded, setExpanded] = useState(false)

  return (
    <li
      data-place={key}
      onMouseEnter={() => selection.hover(key)}
      onMouseLeave={() => selection.hover(null)}
      className={cn(
        // Scrolled into view from the map, a card stops clear of the sticky List/Map bar.
        'flex gap-3 rounded-lg border bg-card text-card-foreground p-3 transition-colors scroll-mb-4 xl:scroll-mt-[calc(var(--view-bar)+0.5rem)]',
        // Drawn inside the border: a ring outside it hides under the sticky List/Map bar.
        selection.isSelected(key) && 'border-primary shadow-[inset_0_0_0_1px_var(--primary)]',
      )}
    >
      <EventThumbnail event={event} />
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted-foreground">{eventMeta(event, distanceFrom)}</div>
        <Link
          href={`/events/${event.slug}`}
          className="font-semibold leading-tight hover:underline"
        >
          {event.title}
        </Link>
        <div className="text-sm text-muted-foreground">{describeWhere(event.location)}</div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <ShowOnMapButton placeKey={key} title={event.title} selection={selection} />
          <DetailsToggle
            expanded={expanded}
            controls={detailsId}
            title={event.title}
            onToggle={() => setExpanded(!expanded)}
          />
        </div>
        {expanded && <EventDetails event={event} id={detailsId} />}
        <EventActions event={event} size="compact" className="mt-2 flex flex-wrap gap-2" />
      </div>
    </li>
  )
}

function EventCards({ events, ...cardProps }: CardsProps & { events: Event[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {events.map((event) => (
        <EventMapCard key={event.id} event={event} {...cardProps} />
      ))}
    </ul>
  )
}

/** Virtual and never-placed events still belong in the list, just not on the map. */
function UnplacedEvents({ events, ...cardProps }: CardsProps & { events: Event[] }) {
  const unplaced = events.filter((event) => !pointOf(event))
  if (unplaced.length === 0) return null
  return (
    <>
      <h3 className="mt-6 mb-2 text-sm font-semibold text-muted-foreground">Not on the map</h3>
      <EventCards events={unplaced} {...cardProps} />
    </>
  )
}

/** Says when the filters match more events than one load holds. */
function CappedNotice({ shown, total }: { shown: number; total: number }) {
  if (total <= shown) return null
  return (
    <p className="mb-3 rounded-md border bg-muted px-3 py-2 text-sm">
      Showing {shown} of {total} matching events. Narrow the dates or filters, or search a smaller
      map area, to see the rest.
    </p>
  )
}

function NoEvents({ searchingArea }: { searchingArea: boolean }) {
  return (
    <p className="text-muted-foreground py-8 text-center">
      {searchingArea ? 'No events in this map area.' : 'No events found matching your criteria.'}
    </p>
  )
}

export function EventsMapList({
  state,
  searchingArea,
  ...cardProps
}: CardsProps & {
  state: EventsState
  searchingArea: boolean
}) {
  if (state.error) return <p className="text-destructive">{state.error}</p>
  if (!state.events) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
  if (state.events.length === 0) return <NoEvents searchingArea={searchingArea} />

  return (
    <>
      <CappedNotice shown={state.events.length} total={state.total} />
      <EventCards events={state.events.filter(pointOf)} {...cardProps} />
      <UnplacedEvents events={state.events} {...cardProps} />
    </>
  )
}

/** The searched map area, with a way back to every event the filters match. */
export function SearchedAreaBar({ loading, onClear }: { loading: boolean; onClear: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2 pb-2 xl:px-1 text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        Showing events in the map area
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      </span>
      <button
        type="button"
        onClick={onClear}
        className="inline-flex items-center gap-1 text-primary hover:underline"
      >
        <X className="h-3.5 w-3.5" /> Clear area
      </button>
    </div>
  )
}

const eventCount = (shown: number, total: number) =>
  total > shown ? `${shown} of ${total} events` : `${shown} ${shown === 1 ? 'event' : 'events'}`

function countMessage(state: EventsState, searchingArea: boolean): string {
  if (!state.events || state.loading) return ''
  const count = eventCount(state.events.length, state.total)
  return searchingArea ? `${count} in this map area` : count
}

/** Always rendered, so screen readers hear the new count after a filter or area search. */
export function ResultsStatus({
  state,
  searchingArea,
}: {
  state: EventsState
  searchingArea: boolean
}) {
  return (
    <p role="status" className="sr-only">
      {countMessage(state, searchingArea)}
    </p>
  )
}
