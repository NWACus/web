'use client'

import { EventActions } from '@/components/EventPreview/EventActions'
import { Button } from '@/components/ui/button'
import type { Event } from '@/payload-types'
import type { BoundingBox, LatLng } from '@/utilities/geo/distance'
import { cn } from '@/utilities/ui'
import { Filter, FilterX, List, Loader2, Map as MapIcon, X } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { useEffect, useId, useRef, useState, type RefObject } from 'react'
import type { FocusRequest, Insets } from './EventsMap.client'
import {
  eventCount,
  EventsMapList,
  EventSummary,
  EventThumbnail,
  ResultsStatus,
  type CardSelection,
} from './EventsMapList'
import { EventsSort, FLOATING_BUTTON } from './EventsSort'
import type { EventPlace } from './eventPlaces'
import { setFiltersDrawerOpen } from './filtersDrawerOpen'
import { distanceOrigin, type EventsState } from './useAllFilteredEvents'
import type { NearOrigin } from './useNearOrigin'

// mapbox-gl touches `window` when imported, so the map only loads in the browser.
const EventsMap = dynamic(() => import('./EventsMap.client').then((mod) => mod.EventsMap), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted" />,
})

/** The floating bar's height: its buttons (`h-10`) and padding (`p-3`). */
const BAR_HEIGHT = 64
/** Where the list's top edge rests, as a share of the map's height. */
const LIST_TOP = 0.6
/** The gap below the docked card, which the map also keeps clear. */
const CARD_GAP = 12

/** The filters the page's Filters button marks as in use. */
const FILTER_PARAMS = ['types', 'startDate', 'endDate', 'groups', 'tags', 'modesOfTravel']

const scrollBehavior = (): ScrollBehavior =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'

/** Where the site's sticky header strip ends: the map fills the screen below it. */
function useHeaderBottom(): number {
  const [bottom, setBottom] = useState(0)
  useEffect(() => {
    const strip = document.querySelector('header')?.parentElement
    if (!strip) return
    const observer = new ResizeObserver(() =>
      setBottom(Math.max(0, strip.getBoundingClientRect().bottom)),
    )
    observer.observe(strip)
    return () => observer.disconnect()
  }, [])
  return bottom
}

/** The page behind the map stays put while the list scrolls over the map. */
function useLockPageScroll() {
  useEffect(() => {
    const root = document.documentElement
    const previous = root.style.overflow
    root.style.overflow = 'hidden'
    return () => {
      root.style.overflow = previous
    }
  }, [])
}

function useHeight(ref: RefObject<HTMLElement | null>, active = true): number {
  const [height, setHeight] = useState(0)
  useEffect(() => {
    const node = ref.current
    if (!node || !active) return
    const observer = new ResizeObserver(() => setHeight(node.offsetHeight))
    observer.observe(node)
    return () => observer.disconnect()
  }, [ref, active])
  return height
}

/** Whether the list has scrolled up far enough to cover the whole map. */
function useListCoversMap(scrollerRef: RefObject<HTMLElement | null>, coveredAt: number) {
  const [covers, setCovers] = useState(false)
  useEffect(() => {
    const node = scrollerRef.current
    if (!node) return
    const update = () => setCovers(node.scrollTop >= coveredAt)
    update()
    node.addEventListener('scroll', update, { passive: true })
    return () => node.removeEventListener('scroll', update)
  }, [scrollerRef, coveredAt])
  return covers
}

/**
 * The place whose card is open. Opening it adds one history entry at the same URL, so Back closes
 * the card before it leaves the map, as it would a page.
 */
function usePlaceSelection(places: EventPlace[]) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [focus, setFocus] = useState<FocusRequest | null>(null)
  const pushedRef = useRef(false)

  useEffect(() => {
    const onPopState = () => {
      if (!pushedRef.current) return
      pushedRef.current = false
      setSelectedKey(null)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  return {
    selectedKey,
    focus,
    place: places.find((candidate) => candidate.key === selectedKey) ?? null,
    /** `zoomIn` for "Show on map"; a tapped pin is already in view. */
    open: (key: string, zoomIn: boolean) => {
      if (!pushedRef.current) {
        window.history.pushState(window.history.state, '', window.location.href)
        pushedRef.current = true
      }
      setSelectedKey(key)
      setFocus(zoomIn ? { key, requestedAt: Date.now() } : null)
    },
    close: () => {
      if (pushedRef.current) window.history.back()
      else setSelectedKey(null)
    },
  }
}

function focusShowOnMapButton(placeKey: string) {
  document
    .querySelector<HTMLButtonElement>(
      `[data-place="${placeKey}"] button[aria-label^="Show on map"]`,
    )
    ?.focus()
}

/** Closing a card opened from "Show on map" puts focus back on that button. */
function useReturnFocus(selectedKey: string | null) {
  const returnToRef = useRef<string | null>(null)
  const previousRef = useRef(selectedKey)
  useEffect(() => {
    const closed = previousRef.current
    previousRef.current = selectedKey
    if (selectedKey || !closed || returnToRef.current !== closed) return
    returnToRef.current = null
    focusShowOnMapButton(closed)
  }, [selectedKey])
  return returnToRef
}

function useHasActiveFilters(): boolean {
  const params = useSearchParams()
  return FILTER_PARAMS.some((key) => params.get(key))
}

function MapBar({ onShowList }: { onShowList: () => void }) {
  const FilterIcon = useHasActiveFilters() ? FilterX : Filter
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center gap-2 p-3 [&>*]:pointer-events-auto">
      <Button variant="outline" size="sm" className={FLOATING_BUTTON} onClick={onShowList}>
        <List /> List
      </Button>
      <Button
        variant="outline"
        size="sm"
        className={FLOATING_BUTTON}
        onClick={() => setFiltersDrawerOpen(true)}
      >
        Filters <FilterIcon />
      </Button>
      <EventsSort floating />
    </div>
  )
}

function listHeading(state: EventsState, searchingArea: boolean): string {
  if (!state.events) return 'Loading events…'
  const count = eventCount(state.events.length, state.total)
  const online = state.events.filter((event) => event.location?.isVirtual).length
  return [searchingArea ? `${count} in this area` : count, online && `${online} online`]
    .filter(Boolean)
    .join(' · ')
}

function ListHeader({
  state,
  searchingArea,
  onClearArea,
}: {
  state: EventsState
  searchingArea: boolean
  onClearArea: () => void
}) {
  return (
    // Sticks under the floating bar once the list covers the map.
    <div className="sticky top-16 z-10 -mx-4 rounded-t-2xl bg-background px-4 pt-2 pb-3">
      <div aria-hidden className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-gray-300" />
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-semibold">
          {listHeading(state, searchingArea)}
          {state.loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </h2>
        {searchingArea && (
          <button
            type="button"
            onClick={onClearArea}
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <X className="h-3.5 w-3.5" /> Clear area
          </button>
        )}
      </div>
    </div>
  )
}

/** The list, in a scroller that spans the map but only takes touches on the list itself. */
function ListSheet({
  scrollerRef,
  restingTop,
  hidden,
  state,
  searchedBox,
  onClearArea,
  selection,
  distanceFrom,
}: {
  scrollerRef: RefObject<HTMLDivElement | null>
  restingTop: number
  /** While a card shows a place instead. */
  hidden: boolean
  state: EventsState
  searchedBox: BoundingBox | null
  onClearArea: () => void
  selection: CardSelection
  distanceFrom: LatLng | null
}) {
  return (
    <div
      ref={scrollerRef}
      className={cn(
        'pointer-events-none absolute inset-0 z-10 overflow-y-auto overscroll-contain',
        hidden && 'invisible',
      )}
    >
      <div aria-hidden style={{ height: restingTop }} />
      <section
        aria-label="Events"
        className="pointer-events-auto relative min-h-full rounded-t-2xl bg-background px-4 pb-24 shadow-[0_-4px_16px_rgb(0_0_0/0.15)]"
      >
        <ListHeader state={state} searchingArea={searchedBox !== null} onClearArea={onClearArea} />
        <ResultsStatus state={state} searchingArea={searchedBox !== null} />
        <div className={cn('transition-opacity', state.loading && 'opacity-60')}>
          <EventsMapList
            state={state}
            searchingArea={searchedBox !== null}
            selection={selection}
            distanceFrom={distanceFrom}
          />
        </div>
      </section>
    </div>
  )
}

/** Once the list covers the map: a strip for the floating bar to sit on, and a way back up. */
function CoveredMapControls({ shown, onShowMap }: { shown: boolean; onShowMap: () => void }) {
  if (!shown) return null
  return (
    <>
      <div className="absolute inset-x-0 top-0 z-[15] h-16 bg-background shadow-sm" />
      <Button
        onClick={onShowMap}
        className="absolute bottom-5 left-1/2 z-20 h-11 -translate-x-1/2 rounded-full bg-foreground px-5 text-background shadow-lg hover:bg-foreground"
      >
        <MapIcon /> Map
      </Button>
    </>
  )
}

function PlaceEvent({ event, distanceFrom }: { event: Event; distanceFrom: LatLng | null }) {
  return (
    <li className="flex gap-3">
      <EventThumbnail event={event} />
      <div className="min-w-0 flex-1">
        <EventSummary event={event} distanceFrom={distanceFrom} />
        <EventActions event={event} size="compact" className="mt-2 flex flex-wrap gap-2" />
      </div>
    </li>
  )
}

/** The selected place's events, docked over the map in place of a popup. */
function PlaceCard({
  place,
  distanceFrom,
  cardRef,
  takeFocus,
  onClose,
}: {
  place: EventPlace
  distanceFrom: LatLng | null
  cardRef: RefObject<HTMLElement | null>
  takeFocus: boolean
  onClose: () => void
}) {
  const headingId = useId()
  const name = place.events[0]?.location?.placeName || 'This place'
  useEffect(() => {
    if (takeFocus) cardRef.current?.focus()
  }, [cardRef, takeFocus])
  return (
    <section
      ref={cardRef}
      tabIndex={-1}
      aria-labelledby={headingId}
      className="absolute inset-x-3 z-20 flex max-h-[55%] flex-col rounded-2xl bg-background shadow-xl outline-none animate-in slide-in-from-bottom duration-200"
      style={{ bottom: CARD_GAP }}
    >
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <h2 id={headingId} className="line-clamp-1 font-semibold">
          {name}
        </h2>
        <span className="shrink-0 text-sm text-muted-foreground">
          {eventCount(place.events.length, place.events.length)}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label={`Close ${name}`}
          className="ml-auto rounded-full p-1.5 hover:bg-muted"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <ul className="flex flex-col gap-4 overflow-y-auto overscroll-contain px-4 pb-4">
        {place.events.map((event) => (
          <PlaceEvent key={event.id} event={event} distanceFrom={distanceFrom} />
        ))}
      </ul>
    </section>
  )
}

/** Where the list rests and what the map has to keep clear: the bar, and the list or card. */
function useLayout(
  frameRef: RefObject<HTMLDivElement | null>,
  cardRef: RefObject<HTMLElement | null>,
  cardOpen: boolean,
) {
  const height = useHeight(frameRef)
  const cardHeight = useHeight(cardRef, cardOpen)
  const restingTop = Math.round(height * LIST_TOP)
  const bottom = cardOpen ? cardHeight + CARD_GAP : height - restingTop
  const insets: Insets = { top: BAR_HEIGHT, bottom }
  return { restingTop, insets }
}

interface PhoneMapViewProps {
  state: EventsState
  places: EventPlace[]
  origin: NearOrigin | null
  searchedBox: BoundingBox | null
  onSearchArea: (box: BoundingBox) => void
  onClearArea: () => void
  onShowList: () => void
}

/**
 * The map view on a phone: the map fills the screen under the site header, and the list scrolls up
 * over it from 60% down, as on Airbnb. A pin opens its place's card in place of the list.
 */
export function PhoneMapView({
  state,
  places,
  origin,
  searchedBox,
  onSearchArea,
  onClearArea,
  onShowList,
}: PhoneMapViewProps) {
  const top = useHeaderBottom()
  useLockPageScroll()
  const frameRef = useRef<HTMLDivElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLElement>(null)
  const selection = usePlaceSelection(places)
  const { place } = selection
  const { restingTop, insets } = useLayout(frameRef, cardRef, place !== null)
  const listCoversMap = useListCoversMap(scrollerRef, restingTop - BAR_HEIGHT)
  const returnFocusRef = useReturnFocus(selection.selectedKey)
  const distanceFrom = distanceOrigin(state, origin)

  const scrollToMap = () => scrollerRef.current?.scrollTo({ top: 0, behavior: scrollBehavior() })
  const cardSelection: CardSelection = {
    hover: () => {},
    isSelected: (key) => key !== null && key === selection.selectedKey,
    showOnMap: (key) => {
      returnFocusRef.current = key
      scrollToMap()
      selection.open(key, true)
    },
  }

  return (
    <div
      ref={frameRef}
      // Under the sticky header (z-50), the open mobile menu (z-40) and the filter drawer.
      className="fixed inset-x-0 bottom-0 z-30 overflow-hidden bg-background"
      style={{ top }}
    >
      <EventsMap
        places={places}
        selectedKey={selection.selectedKey}
        hoveredKey={null}
        focus={selection.focus}
        searchedBox={searchedBox}
        origin={origin}
        onSelect={(key) => selection.open(key, false)}
        onClear={selection.close}
        onSearchArea={onSearchArea}
        insets={insets}
      />
      <CoveredMapControls shown={listCoversMap && !place} onShowMap={scrollToMap} />
      <MapBar onShowList={onShowList} />
      <ListSheet
        scrollerRef={scrollerRef}
        restingTop={restingTop}
        hidden={place !== null}
        state={state}
        searchedBox={searchedBox}
        onClearArea={onClearArea}
        selection={cardSelection}
        distanceFrom={distanceFrom}
      />
      {place && (
        <PlaceCard
          place={place}
          distanceFrom={distanceFrom}
          cardRef={cardRef}
          takeFocus={returnFocusRef.current === place.key}
          onClose={selection.close}
        />
      )}
    </div>
  )
}
