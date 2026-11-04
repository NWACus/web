'use client'

import type { Event } from '@/payload-types'
import { formatBoxParam, parseBoxParam } from '@/utilities/geo/boxParam'
import type { BoundingBox } from '@/utilities/geo/distance'
import { cn } from '@/utilities/ui'
import dynamic from 'next/dynamic'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { groupEventsByPlace } from './eventPlaces'
import type { FocusRequest } from './EventsMap.client'
import { EventsMapList, ResultsStatus, SearchedAreaBar, type CardsProps } from './EventsMapList'
import { PhoneMapView } from './PhoneMapView'
import { distanceOrigin, useAllFilteredEvents, type EventsState } from './useAllFilteredEvents'
import { useIsPhone } from './useIsPhone'
import { useNearOrigin } from './useNearOrigin'

// mapbox-gl touches `window` when imported, so the map only loads in the browser.
const EventsMap = dynamic(() => import('./EventsMap.client').then((mod) => mod.EventsMap), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted" />,
})

// The list and map sit side by side from Tailwind's `xl` up.
const SIDE_BY_SIDE = '(min-width: 1280px)'

export const LIST_COLUMN_WIDTH = 'xl:w-[400px]'

const NO_EVENTS: Event[] = []

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

/** The list column, which scrolls with the page while the map beside it stays put. */
function ListPane({
  state,
  searchedBox,
  listRef,
  onClearArea,
  ...cardProps
}: CardsProps & {
  state: EventsState
  searchedBox: BoundingBox | null
  listRef: RefObject<HTMLDivElement | null>
  onClearArea: () => void
}) {
  return (
    <div ref={listRef} className={cn('xl:order-1 shrink-0', LIST_COLUMN_WIDTH)}>
      <ResultsStatus state={state} searchingArea={searchedBox !== null} />
      {searchedBox && <SearchedAreaBar loading={state.loading} onClear={onClearArea} />}
      {/* Dimmed while the next set loads; the last set stays up until it arrives. */}
      <div className={cn('transition-opacity', state.loading && 'opacity-60')}>
        <EventsMapList state={state} searchingArea={searchedBox !== null} {...cardProps} />
      </div>
    </div>
  )
}

/**
 * The events beside a map of the same events: pins and list items select each other. On a phone,
 * the map fills the screen and the list scrolls up over it instead (`PhoneMapView`).
 */
export function EventsMapView({
  center,
  revealOnMount,
  onShowList,
}: {
  center: string
  revealOnMount: boolean
  onShowList: () => void
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
  const isPhone = useIsPhone()

  if (isPhone) {
    return (
      <PhoneMapView
        state={state}
        places={places}
        origin={origin}
        searchedBox={searchedBox}
        onSearchArea={(box) => setBboxParam(formatBoxParam(box))}
        onClearArea={() => setBboxParam(null)}
        onShowList={onShowList}
      />
    )
  }

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
        distanceFrom={distanceOrigin(state, origin)}
        onClearArea={() => setBboxParam(null)}
      />
    </div>
  )
}
