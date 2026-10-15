'use client'

import { EventInfo } from '@/components/EventInfo'
import { EventActions } from '@/components/EventPreview/EventActions'
import { ImageMedia } from '@/components/Media/ImageMedia'
import { eventTypesData } from '@/constants/eventTypes'
import type { Event } from '@/payload-types'
import { formatDateTime } from '@/utilities/formatDateTime'
import { formatBoxParam, parseBoxParam } from '@/utilities/geo/boxParam'
import type { BoundingBox } from '@/utilities/geo/distance'
import type { GetEventsResult } from '@/utilities/queries/getEvents'
import { isValidRelationship } from '@/utilities/relationships'
import { cn } from '@/utilities/ui'
import { ChevronDown, Loader2, MapPin, X } from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useId, useMemo, useRef, useState, type RefObject } from 'react'
import type { FocusRequest } from './EventsMap.client'
import {
  describeWhere,
  distanceLabel,
  groupEventsByPlace,
  placeKeyFor,
  pointOf,
} from './eventPlaces'
import { useNearOrigin, type NearOrigin } from './useNearOrigin'

// mapbox-gl touches `window` when imported, so the map only loads in the browser.
const EventsMap = dynamic(() => import('./EventsMap.client').then((mod) => mod.EventsMap), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted" />,
})

/**
 * A ceiling on one load, not a page size: centers list a few dozen upcoming events, so this only
 * bites on a wide date range, and `CappedNotice` says so.
 */
const MAP_EVENTS_LIMIT = 200

/** The page's filter params, which the events API reads in the same comma-separated format. */
const FILTER_KEYS = ['types', 'startDate', 'endDate', 'groups', 'tags', 'modesOfTravel', 'bbox']

// The list and map sit side by side from Tailwind's `xl` up.
const SIDE_BY_SIDE = '(min-width: 1280px)'

type Loaded = { events: Event[]; total: number; error: null } | { events: null; error: string }

/** The last events loaded stay up while the next set loads, so pins and cards don't flash away. */
type EventsState = (Loaded | { events: null; error: null }) & { loading: boolean }

const NO_EVENTS: Event[] = []

async function loadEvents(url: string, signal: AbortSignal): Promise<Loaded | null> {
  try {
    const result: GetEventsResult = await fetch(url, { signal }).then((res) => res.json())
    return result.error
      ? { events: null, error: result.error }
      : { events: result.events, total: result.total, error: null }
  } catch {
    return signal.aborted ? null : { events: null, error: 'Failed to load events.' }
  }
}

/** Every event matching the page's filters, unpaginated, nearest first when sorted by distance. */
function useAllFilteredEvents(center: string, origin: NearOrigin | null): EventsState {
  const searchParams = useSearchParams()
  const query = new URLSearchParams()
  for (const key of FILTER_KEYS) {
    const value = searchParams.get(key)
    if (value) query.set(key, value)
  }
  if (origin) query.set('near', origin.query)
  query.set('limit', String(MAP_EVENTS_LIMIT))
  const queryString = query.toString()

  const [state, setState] = useState<EventsState>({ events: null, error: null, loading: true })
  useEffect(() => {
    const controller = new AbortController()
    setState((previous) => ({ ...previous, loading: true }))
    loadEvents(`/api/${center}/events?${queryString}`, controller.signal).then((next) => {
      if (next) setState({ ...next, loading: false })
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

function eventMeta(event: Event, origin: NearOrigin | null): string {
  const typeLabel = eventTypesData.find((type) => type.value === event.type)?.label
  const when = formatDateTime(event.startDate, event.startDate_tz, 'EEE, MMM d · h:mm a')
  const distance = distanceLabel(event, origin?.point ?? null)
  return [typeLabel, when, distance].filter(Boolean).join(' · ')
}

function ShowOnMapButton({
  placeKey,
  title,
  selection,
}: {
  placeKey: string | null
  title: string
  selection: Selection
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

function EventMapCard({ event, selection }: { event: Event; selection: Selection }) {
  const key = placeKeyFor(event)
  const origin = useNearOrigin()
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
        <div className="text-xs text-muted-foreground">{eventMeta(event, origin)}</div>
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

function EventsMapList({
  state,
  searchingArea,
  selection,
}: {
  state: EventsState
  searchingArea: boolean
  selection: Selection
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
      <EventCards events={state.events.filter(pointOf)} selection={selection} />
      <UnplacedEvents events={state.events} selection={selection} />
    </>
  )
}

/** The searched map area, with a way back to every event the filters match. */
function SearchedAreaBar({ loading, onClear }: { loading: boolean; onClear: () => void }) {
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

/**
 * Scrolls the whole map into view. Side by side, that's where it pins under the List/Map bar: its
 * sticky `top`. Stacked, the map isn't sticky (`top` is `auto`), so just enough to show all of it.
 */
function revealMap(map: HTMLElement) {
  const stickyTop = parseFloat(getComputedStyle(map).top)
  if (Number.isNaN(stickyTop)) {
    map.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    return
  }
  window.scrollBy({ top: map.getBoundingClientRect().top - stickyTop, behavior: 'smooth' })
}

function useRevealOnMount(mapRef: RefObject<HTMLDivElement | null>, reveal: boolean) {
  const revealRef = useRef(reveal)
  useEffect(() => {
    if (revealRef.current && mapRef.current) revealMap(mapRef.current)
  }, [mapRef])
}

const eventCount = (shown: number, total: number) =>
  total > shown ? `${shown} of ${total} events` : `${shown} ${shown === 1 ? 'event' : 'events'}`

function countMessage(state: EventsState, searchingArea: boolean): string {
  if (!state.events || state.loading) return ''
  const count = eventCount(state.events.length, state.total)
  return searchingArea ? `${count} in this map area` : count
}

/** Always rendered, so screen readers hear the new count after a filter or area search. */
function ResultsStatus({ state, searchingArea }: { state: EventsState; searchingArea: boolean }) {
  return (
    <p role="status" className="sr-only">
      {countMessage(state, searchingArea)}
    </p>
  )
}

/** The list column, which scrolls with the page while the map beside it stays put. */
function ListPane({
  state,
  searchedBox,
  listRef,
  selection,
  onClearArea,
}: {
  state: EventsState
  searchedBox: BoundingBox | null
  listRef: RefObject<HTMLDivElement | null>
  selection: Selection
  onClearArea: () => void
}) {
  return (
    <div ref={listRef} className="xl:order-1 xl:w-[380px] shrink-0">
      <ResultsStatus state={state} searchingArea={searchedBox !== null} />
      {searchedBox && <SearchedAreaBar loading={state.loading} onClear={onClearArea} />}
      {/* Dimmed while the next set loads; the last set stays up until it arrives. */}
      <div className={cn('transition-opacity', state.loading && 'opacity-60')}>
        <EventsMapList state={state} searchingArea={searchedBox !== null} selection={selection} />
      </div>
    </div>
  )
}

/** The events beside a map of the same events: pins and list items select each other. */
export function EventsMapView({
  center,
  revealOnMount,
}: {
  center: string
  revealOnMount: boolean
}) {
  const origin = useNearOrigin()
  const state = useAllFilteredEvents(center, origin)
  const events = state.events ?? NO_EVENTS
  const { places } = useMemo(() => groupEventsByPlace(events), [events])
  const [bboxParam, setBboxParam] = useQueryState('bbox', parseAsString)
  const searchedBox = useMemo(() => parseBoxParam(bboxParam), [bboxParam])
  const listRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const selection = useSelection(listRef, mapRef)
  useRevealOnMount(mapRef, revealOnMount)

  return (
    <div className="flex flex-col xl:flex-row xl:items-start gap-4">
      {/* Side by side, the map pins under the sticky List/Map bar (--view-bar tall, set in
          EventsResults) and fills the rest of the window while the page scrolls the list. */}
      <div
        ref={mapRef}
        className="h-[360px] xl:sticky xl:top-[var(--view-bar)] xl:h-[calc(100dvh-var(--view-bar)-1rem)] xl:min-h-[400px] xl:order-2 grow rounded-lg border overflow-hidden scroll-mt-4"
      >
        <EventsMap
          places={places}
          selectedKey={selection.selectedKey}
          hoveredKey={selection.hoveredKey}
          focus={selection.focus}
          searchedBox={searchedBox}
          origin={origin}
          onSelect={selection.selectFromMap}
          onClear={selection.clear}
          onSearchArea={(box: BoundingBox) => setBboxParam(formatBoxParam(box))}
        />
      </div>
      <ListPane
        state={state}
        searchedBox={searchedBox}
        listRef={listRef}
        selection={selection}
        onClearArea={() => setBboxParam(null)}
      />
    </div>
  )
}
