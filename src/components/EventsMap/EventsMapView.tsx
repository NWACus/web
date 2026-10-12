'use client'

import { eventTypesData } from '@/constants/eventTypes'
import type { Event } from '@/payload-types'
import { formatDateTime } from '@/utilities/formatDateTime'
import type { GetEventsResult } from '@/utilities/queries/getEvents'
import { cn } from '@/utilities/ui'
import { Loader2, MapPin } from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import type { FocusRequest } from './EventsMap.client'
import { describeWhere, groupEventsByPlace, placeKeyFor, pointOf } from './eventPlaces'

// mapbox-gl touches `window` when imported, so the map only loads in the browser.
const EventsMap = dynamic(() => import('./EventsMap.client').then((mod) => mod.EventsMap), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted" />,
})

/** Enough for every upcoming event a center lists; the map shows them all at once. */
const MAP_EVENTS_LIMIT = 200

/** The page's filter params, which the events API reads in the same comma-separated format. */
const FILTER_KEYS = ['types', 'startDate', 'endDate', 'groups', 'tags', 'modesOfTravel']

// The list only scrolls on its own when it sits beside the map (Tailwind's `xl`).
const SIDE_BY_SIDE = '(min-width: 1280px)'

type EventsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; events: Event[] }

const NO_EVENTS: Event[] = []

async function loadEvents(url: string, signal: AbortSignal): Promise<EventsState | null> {
  try {
    const result: GetEventsResult = await fetch(url, { signal }).then((res) => res.json())
    return result.error
      ? { status: 'error', message: result.error }
      : { status: 'ready', events: result.events }
  } catch {
    return signal.aborted ? null : { status: 'error', message: 'Failed to load events.' }
  }
}

/** Every event matching the page's filters, unpaginated. */
function useAllFilteredEvents(center: string): EventsState {
  const searchParams = useSearchParams()
  const query = new URLSearchParams()
  for (const key of FILTER_KEYS) {
    const value = searchParams.get(key)
    if (value) query.set(key, value)
  }
  query.set('limit', String(MAP_EVENTS_LIMIT))
  const queryString = query.toString()

  const [state, setState] = useState<EventsState>({ status: 'loading' })
  useEffect(() => {
    const controller = new AbortController()
    setState({ status: 'loading' })
    loadEvents(`/api/${center}/events?${queryString}`, controller.signal).then((next) => {
      if (next) setState(next)
    })
    return () => controller.abort()
  }, [center, queryString])

  return state
}

type Selection = {
  selectedKey: string | null
  hoveredKey: string | null
  focus: FocusRequest | null
  hover: (key: string | null) => void
  isSelected: (key: string | null) => boolean
  selectFromMap: (key: string) => void
  showOnMap: (key: string) => void
  clear: () => void
}

/** Which pin is selected or hovered, shared by the map and the list. */
function useSelection(
  listRef: RefObject<HTMLDivElement | null>,
  mapRef: RefObject<HTMLDivElement | null>,
): Selection {
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)
  const [focus, setFocus] = useState<FocusRequest | null>(null)

  return {
    selectedKey,
    hoveredKey,
    focus,
    hover: setHoveredKey,
    isSelected: (key) => key !== null && key === selectedKey,
    clear: () => setSelectedKey(null),
    selectFromMap: (key) => {
      setSelectedKey(key)
      if (!window.matchMedia(SIDE_BY_SIDE).matches) return
      const item = listRef.current?.querySelector(`[data-place="${key}"]`)
      item?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    },
    showOnMap: (key) => {
      setSelectedKey(key)
      setFocus({ key, requestedAt: Date.now() })
      // Stacked layout: the map sits above the list and may be scrolled away.
      if (!window.matchMedia(SIDE_BY_SIDE).matches) {
        mapRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    },
  }
}

function eventMeta(event: Event): string {
  const typeLabel = eventTypesData.find((type) => type.value === event.type)?.label
  const when = formatDateTime(event.startDate, event.startDate_tz, 'EEE, MMM d · h:mm a')
  return [typeLabel, when].filter(Boolean).join(' · ')
}

function ShowOnMapButton({
  placeKey,
  selection,
}: {
  placeKey: string | null
  selection: Selection
}) {
  if (!placeKey) return null
  return (
    <button
      type="button"
      onClick={() => selection.showOnMap(placeKey)}
      className="mt-1 inline-flex items-center gap-1 text-sm text-primary hover:underline"
    >
      <MapPin className="h-3.5 w-3.5" /> Show on map
    </button>
  )
}

function EventMapCard({ event, selection }: { event: Event; selection: Selection }) {
  const key = placeKeyFor(event)

  return (
    <li
      data-place={key}
      onMouseEnter={() => selection.hover(key)}
      onMouseLeave={() => selection.hover(null)}
      className={cn(
        'rounded-lg border bg-card text-card-foreground p-3 transition-colors',
        selection.isSelected(key) && 'border-primary ring-2 ring-primary',
      )}
    >
      <div className="text-xs text-muted-foreground">{eventMeta(event)}</div>
      <Link href={`/events/${event.slug}`} className="font-semibold leading-tight hover:underline">
        {event.title}
      </Link>
      <div className="text-sm text-muted-foreground">{describeWhere(event.location)}</div>
      <ShowOnMapButton placeKey={key} selection={selection} />
    </li>
  )
}

function EventCards({ events, selection }: { events: Event[]; selection: Selection }) {
  return (
    <ul className="flex flex-col gap-3">
      {events.map((event) => (
        <EventMapCard key={event.id} event={event} selection={selection} />
      ))}
    </ul>
  )
}

/** Virtual and never-placed events still belong in the list, just not on the map. */
function UnplacedEvents({ events, selection }: { events: Event[]; selection: Selection }) {
  const unplaced = events.filter((event) => !pointOf(event))
  if (unplaced.length === 0) return null
  return (
    <>
      <h3 className="mt-6 mb-2 text-sm font-semibold text-muted-foreground">Not on the map</h3>
      <EventCards events={unplaced} selection={selection} />
    </>
  )
}

function EventsMapList({ state, selection }: { state: EventsState; selection: Selection }) {
  if (state.status === 'loading') {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
  if (state.status === 'error') return <p className="text-destructive">{state.message}</p>
  if (state.events.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center">
        No events found matching your criteria.
      </p>
    )
  }

  return (
    <>
      <EventCards events={state.events.filter(pointOf)} selection={selection} />
      <UnplacedEvents events={state.events} selection={selection} />
    </>
  )
}

/** The events beside a map of the same events: pins and list items select each other. */
export function EventsMapView({ center }: { center: string }) {
  const state = useAllFilteredEvents(center)
  const events = state.status === 'ready' ? state.events : NO_EVENTS
  const { places } = useMemo(() => groupEventsByPlace(events), [events])
  const listRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const selection = useSelection(listRef, mapRef)

  return (
    <div className="flex flex-col xl:flex-row gap-4 xl:h-[75vh]">
      <div
        ref={mapRef}
        className="h-[360px] xl:h-auto xl:order-2 grow rounded-lg border overflow-hidden scroll-mt-4"
      >
        <EventsMap
          places={places}
          selectedKey={selection.selectedKey}
          hoveredKey={selection.hoveredKey}
          focus={selection.focus}
          onSelect={selection.selectFromMap}
          onClear={selection.clear}
        />
      </div>
      <div ref={listRef} className="xl:order-1 xl:w-[340px] shrink-0 xl:overflow-y-auto xl:pr-1">
        <EventsMapList state={state} selection={selection} />
      </div>
    </div>
  )
}
