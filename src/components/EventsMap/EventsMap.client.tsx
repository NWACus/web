'use client'

import { createProductMap } from '@/components/map/mapbox'
import { MapMarker } from '@/components/stationMap/MapMarker'
import { useMapBackgroundClick } from '@/components/stationMap/useStationMap'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/utilities/formatDateTime'
import type { BoundingBox, LatLng } from '@/utilities/geo/distance'
import { cn } from '@/utilities/ui'
import { MapPin, Search } from 'lucide-react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { clusterPlaces, mapItemsAt, type PlaceCluster } from './clusters'
import type { EventPlace } from './eventPlaces'
import type { NearOrigin } from './useNearOrigin'

export type FocusRequest = { key: string; requestedAt: number }

interface EventsMapProps {
  places: EventPlace[]
  selectedKey: string | null
  hoveredKey: string | null
  focus: FocusRequest | null
  /** The map area the reader searched, which the events are already narrowed to. */
  searchedBox: BoundingBox | null
  /** Where the events are sorted from, marked on the map. */
  origin: NearOrigin | null
  onSelect: (key: string) => void
  onClear: () => void
  onSearchArea: (box: BoundingBox) => void
  /**
   * Set when the map fills a phone's screen: how far the controls along its top and the list or
   * card along its bottom reach over it. The selected place shows in that card, not a popup.
   */
  insets?: Insets
}

export type Insets = { top: number; bottom: number }

const FIT_PADDING = 48
const FOCUS_ZOOM = 11

function useEventsMapInstance(containerRef: RefObject<HTMLDivElement | null>, fullScreen: boolean) {
  const [map, setMap] = useState<mapboxgl.Map | null>(null)

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    const wrapper = containerRef.current
    if (!wrapper || !token) return
    const { map: instance, remove } = createProductMap(
      wrapper,
      token,
      { center: [-114, 44], zoom: 3.5 },
      'Events map',
      { fullScreen },
    )
    setMap(instance)
    return () => {
      setMap(null)
      remove()
    }
  }, [containerRef, fullScreen])

  return map
}

/**
 * Frames every pin whenever the set of pins changes, i.e. when the filters change. Not while an
 * area search is on: the reader chose that view, so it stays put as the results come in.
 */
function useFitToPlaces(
  map: mapboxgl.Map | null,
  places: EventPlace[],
  searching: boolean,
  insets: Insets | undefined,
) {
  // Sorted, so the same pins in a new order (a change of sort) don't refit the map.
  const placesKey = places
    .map((place) => place.key)
    .sort()
    .join('|')
  const placesRef = useRef(places)
  placesRef.current = places
  // Read, not a dependency: clearing the area refits once its wider results land, not first on
  // the in-area pins still showing.
  const searchingRef = useRef(searching)
  searchingRef.current = searching
  const paddingRef = useRef(fitPadding(insets))
  paddingRef.current = fitPadding(insets)

  useEffect(() => {
    const bounds = boundsOf(placesRef.current)
    if (!map || searchingRef.current || !bounds) return
    map.fitBounds(bounds, { padding: paddingRef.current, maxZoom: FOCUS_ZOOM, duration: 0 })
  }, [map, placesKey])
}

/** Full screen, the pins are framed in the part of the map nothing is laid over. */
function fitPadding(insets: Insets | undefined): number | mapboxgl.PaddingOptions {
  if (!insets) return FIT_PADDING
  return {
    top: insets.top + FIT_PADDING,
    bottom: insets.bottom + FIT_PADDING,
    left: FIT_PADDING,
    right: FIT_PADDING,
  }
}

function boundsOf(places: EventPlace[]): mapboxgl.LngLatBounds | null {
  if (places.length === 0) return null
  const bounds = new mapboxgl.LngLatBounds()
  for (const place of places) bounds.extend([place.longitude, place.latitude])
  return bounds
}

/** A link to a searched area opens on that area. */
function useOpenOnSearchedBox(map: mapboxgl.Map | null, searchedBox: BoundingBox | null) {
  const initialBox = useRef(searchedBox)
  useEffect(() => {
    const box = initialBox.current
    if (!map || !box) return
    map.fitBounds(
      [
        [box.west, box.south],
        [box.east, box.north],
      ],
      { duration: 0 },
    )
  }, [map])
}

/** The map's whole-number zoom, which is all clustering changes with. */
function useZoomLevel(map: mapboxgl.Map | null) {
  const [zoom, setZoom] = useState(0)
  useEffect(() => {
    if (!map) return
    const update = () => setZoom(Math.floor(map.getZoom()))
    update()
    map.on('moveend', update)
    return () => {
      map.off('moveend', update)
    }
  }, [map])
  return zoom
}

/** Whether the reader panned or zoomed last; the map's own moves (fitting, flying) reset it. */
function useMovedByReader(map: mapboxgl.Map | null) {
  const [moved, setMoved] = useState(false)
  useEffect(() => {
    if (!map) return
    // Mapbox passes a window resize along as if the reader moved: a phone rotating, or iOS
    // Safari's toolbar hiding as the page scrolls.
    const onMoveEnd = (event: { originalEvent?: unknown }) =>
      setMoved(event.originalEvent instanceof Event && event.originalEvent.type !== 'resize')
    map.on('moveend', onMoveEnd)
    return () => {
      map.off('moveend', onMoveEnd)
    }
  }, [map])
  return { moved, reset: () => setMoved(false) }
}

/**
 * Everything the reader can see, as a box. Read from the container's corners: `getBounds()` leaves
 * out the camera padding `fitBounds` keeps, and the pins framed into that padding with it.
 */
function viewBox(map: mapboxgl.Map): BoundingBox {
  const { clientWidth, clientHeight } = map.getContainer()
  const southWest = map.unproject([0, clientHeight])
  const northEast = map.unproject([clientWidth, 0])
  // Panned onto a repeated copy of the world, Mapbox reports longitudes past ±180: shift back to
  // the copy the centre is on, then clamp what still hangs over the edge when zoomed far out.
  const center = map.getCenter()
  const shift = center.lng - center.wrap().lng
  return {
    west: Math.max(southWest.lng - shift, -180),
    south: southWest.lat,
    east: Math.min(northEast.lng - shift, 180),
    north: northEast.lat,
  }
}

function SearchAreaButton({
  map,
  shown,
  top,
  onSearch,
}: {
  map: mapboxgl.Map | null
  shown: boolean
  /** Below whatever floats along the map's top. */
  top: number
  onSearch: (box: BoundingBox) => void
}) {
  if (!map || !shown) return null
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => onSearch(viewBox(map))}
      style={{ top: top + SEARCH_AREA_GAP }}
      className="absolute left-1/2 -translate-x-1/2 z-10 rounded-full shadow-md"
    >
      <Search /> Search this area
    </Button>
  )
}

const SEARCH_AREA_GAP = 12

// How far a popup stays from the map's edges.
const POPUP_MARGIN = 12

/** How far `[start, end]` sticks out past `[min, max]`: negative before it, positive after. */
const overshoot = (start: number, end: number, min: number, max: number) =>
  Math.min(0, start - min) || Math.max(0, end - max)

/** Pans the map just enough to show the whole popup when it opens hanging off an edge. */
function panToShow(map: mapboxgl.Map, popupElement: HTMLElement) {
  const popup = popupElement.getBoundingClientRect()
  const frame = map.getContainer().getBoundingClientRect()
  const dx = overshoot(
    popup.left,
    popup.right,
    frame.left + POPUP_MARGIN,
    frame.right - POPUP_MARGIN,
  )
  const dy = overshoot(
    popup.top,
    popup.bottom,
    frame.top + POPUP_MARGIN,
    frame.bottom - POPUP_MARGIN,
  )
  if (dx || dy) map.panBy([dx, dy])
}

function usePanIntoView(map: mapboxgl.Map, popupRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const show = () => {
      const popup = popupRef.current
      // A pin split out of a cluster isn't on the map until its marker is added.
      if (popup?.isConnected) panToShow(map, popup)
    }
    // A frame later, "Show on map" has started its fly to the pin, which would cancel a pan now:
    // pan once it lands instead.
    const frame = requestAnimationFrame(() => {
      if (map.isMoving()) map.once('moveend', show)
      else show()
    })
    return () => {
      cancelAnimationFrame(frame)
      map.off('moveend', show)
    }
  }, [map, popupRef])
}

function PlacePopup({ map, place }: { map: mapboxgl.Map; place: EventPlace }) {
  const popupRef = useRef<HTMLDivElement>(null)
  usePanIntoView(map, popupRef)
  return (
    <div
      ref={popupRef}
      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 rounded-md border bg-card text-card-foreground p-3 shadow-lg text-left"
    >
      <ul className="flex max-h-64 flex-col gap-2 overflow-y-auto">
        {place.events.map((event) => (
          <li key={event.id}>
            {/* Out of the tab order: the marker is aria-hidden, and each card carries the same link. */}
            <Link
              href={`/events/${event.slug}`}
              tabIndex={-1}
              className="font-semibold text-sm hover:underline"
            >
              {event.title}
            </Link>
            <div className="text-xs text-muted-foreground">
              {formatDateTime(event.startDate, event.startDate_tz, 'EEE, MMM d')}
              {event.location?.placeName && ` · ${event.location.placeName}`}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** A click on the map's background closes the popup, and so does Escape, as it would a dialog. */
function useClosePopup(map: mapboxgl.Map | null, selectedKey: string | null, onClose: () => void) {
  useMapBackgroundClick(map, onClose)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const open = selectedKey !== null
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      // Already handled by an open popover, such as the sort menu, which closes instead.
      if (event.key === 'Escape' && !event.defaultPrevented) onCloseRef.current()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])
}

/** Flies to a pin when the list asks to show an event on the map. */
function useFlyToFocus(map: mapboxgl.Map | null, places: EventPlace[], focus: FocusRequest | null) {
  const placesRef = useRef(places)
  placesRef.current = places
  useEffect(() => {
    const place = focus && placesRef.current.find((candidate) => candidate.key === focus.key)
    if (!map || !place) return
    map.flyTo({
      center: [place.longitude, place.latitude],
      zoom: Math.max(map.getZoom(), FOCUS_ZOOM),
    })
  }, [map, focus])
}

/** The camera move that centres a place, and for "Show on map" zooms in, clear of the insets. */
function insetMove(
  map: mapboxgl.Map,
  insets: Insets,
  place: EventPlace | undefined,
  zoomIn: boolean,
): mapboxgl.EasingOptions {
  const padding = { ...insets, left: 0, right: 0 }
  if (!place) return { padding }
  const center: [number, number] = [place.longitude, place.latitude]
  return zoomIn
    ? { padding, center, zoom: Math.max(map.getZoom(), FOCUS_ZOOM) }
    : { padding, center }
}

/**
 * Full screen, the list or a card covers the bottom of the map. One move keeps the selected pin
 * centred in what still shows and, for "Show on map", zooms in to it: the card opening changes
 * the insets mid-flight, and a second move would cancel the first.
 */
function useInsetCamera(
  map: mapboxgl.Map | null,
  places: EventPlace[],
  insets: Insets | undefined,
  selectedKey: string | null,
  focus: FocusRequest | null,
) {
  const placesRef = useRef(places)
  placesRef.current = places
  const insetsRef = useRef(insets)
  insetsRef.current = insets
  // The insets are a fresh object each render; only a change in size should move the camera.
  const insetsKey = insets && `${insets.top},${insets.bottom}`
  const zoomIn = focus?.key === selectedKey
  const requestedAt = focus?.requestedAt
  useEffect(() => {
    const current = insetsRef.current
    if (!map || !current) return
    const place = placesRef.current.find((candidate) => candidate.key === selectedKey)
    map.easeTo(insetMove(map, current, place, zoomIn))
  }, [map, insetsKey, selectedKey, zoomIn, requestedAt])
}

/** Keeps the Mapbox logo, attribution and zoom buttons above the list or card covering the map. */
function useLiftBottomControls(map: mapboxgl.Map | null, bottom: number | undefined) {
  useEffect(() => {
    if (!map || bottom === undefined) return
    const corners = map
      .getContainer()
      .querySelectorAll<HTMLElement>('.mapboxgl-ctrl-bottom-left, .mapboxgl-ctrl-bottom-right')
    for (const corner of corners) corner.style.bottom = `${bottom}px`
  }, [map, bottom])
}

/**
 * Where the camera goes: framing the pins, or a searched area. Embedded, "Show on map" flies to the
 * pin and the selected place opens a popup. Full screen (`insets` set), the camera keeps the
 * selection clear of the list or card, which shows the place instead.
 */
function useCamera(
  map: mapboxgl.Map | null,
  { places, searchedBox, insets, selectedKey, focus }: CameraInputs,
) {
  useFitToPlaces(map, places, searchedBox !== null, insets)
  useOpenOnSearchedBox(map, searchedBox)
  useFlyToFocus(map, places, insets ? null : focus)
  useInsetCamera(map, places, insets, selectedKey, focus)
  useLiftBottomControls(map, insets?.bottom)
  if (!insets) return { popupKey: selectedKey, searchTop: 0 }
  return { popupKey: null, searchTop: insets.top }
}

type CameraInputs = Pick<
  EventsMapProps,
  'places' | 'searchedBox' | 'insets' | 'selectedKey' | 'focus'
>

/** The point the list is sorted from, drawn like a "you are here" dot so it reads apart from pins. */
function OriginDot({ map, point }: { map: mapboxgl.Map; point: LatLng }) {
  const lngLat = useMemo<[number, number]>(
    () => [point.longitude, point.latitude],
    [point.longitude, point.latitude],
  )
  return (
    <MapMarker map={map} lngLat={lngLat}>
      <div className="h-4 w-4 rounded-full border-2 border-white bg-blue-600 shadow-[0_0_0_6px_rgb(37_99_235_/_0.25)]" />
    </MapMarker>
  )
}

function OriginMarker({ map, origin }: { map: mapboxgl.Map | null; origin: NearOrigin | null }) {
  return map && origin && <OriginDot map={map} point={origin.point} />
}

interface EventPinProps {
  map: mapboxgl.Map
  place: EventPlace
  selected: boolean
  active: boolean
  onSelect: (key: string) => void
}

function EventPin({ map, place, selected, active, onSelect }: EventPinProps) {
  // Stable so the marker isn't torn down and re-added on every render.
  const lngLat = useMemo<[number, number]>(
    () => [place.longitude, place.latitude],
    [place.longitude, place.latitude],
  )
  return (
    <MapMarker map={map} lngLat={lngLat} raised={active}>
      <div className="relative">
        <div
          onClick={() => onSelect(place.key)}
          className={cn(
            'flex h-8 min-w-8 px-1 items-center justify-center rounded-full border-2 border-white shadow-md text-xs font-semibold cursor-pointer transition-transform',
            active
              ? 'bg-foreground text-background scale-125'
              : 'bg-primary text-primary-foreground',
          )}
        >
          {place.events.length > 1 ? place.events.length : <MapPin className="h-4 w-4" />}
        </div>
        {selected && <PlacePopup map={map} place={place} />}
      </div>
    </MapMarker>
  )
}

interface ClusterPinProps {
  map: mapboxgl.Map
  cluster: PlaceCluster
  active: boolean
}

/** Several places' events as one marker; a click zooms in until they split. */
function ClusterPin({ map, cluster, active }: ClusterPinProps) {
  const lngLat = useMemo<[number, number]>(
    () => [cluster.longitude, cluster.latitude],
    [cluster.longitude, cluster.latitude],
  )
  return (
    <MapMarker map={map} lngLat={lngLat} raised={active}>
      <div
        onClick={() => map.easeTo({ center: lngLat, zoom: cluster.expansionZoom })}
        className={cn(
          'flex h-10 min-w-10 px-1.5 items-center justify-center rounded-full border-2 border-white text-sm font-semibold cursor-pointer transition-transform shadow-[0_0_0_4px_var(--primary),0_4px_6px_rgb(0_0_0_/_0.2)]',
          active ? 'bg-foreground text-background scale-110' : 'bg-primary text-primary-foreground',
        )}
      >
        {cluster.eventCount}
      </div>
    </MapMarker>
  )
}

interface PinsProps {
  map: mapboxgl.Map | null
  places: EventPlace[]
  selectedKey: string | null
  hoveredKey: string | null
  onSelect: (key: string) => void
  /** The place whose popup is open: the selected one, unless a card shows it instead. */
  popupKey: string | null
}

/** A pin per place, with places that would overlap at this zoom merged into clusters. */
function Pins({ map, places, selectedKey, hoveredKey, onSelect, popupKey }: PinsProps) {
  const zoom = useZoomLevel(map)
  const clusters = useMemo(() => clusterPlaces(places, selectedKey), [places, selectedKey])
  const items = useMemo(() => mapItemsAt(clusters, zoom), [clusters, zoom])
  if (!map) return null
  return items.map((item) =>
    item.kind === 'cluster' ? (
      <ClusterPin
        key={`cluster-${item.cluster.id}`}
        map={map}
        cluster={item.cluster}
        active={hoveredKey !== null && item.cluster.keys.includes(hoveredKey)}
      />
    ) : (
      <EventPin
        key={item.place.key}
        map={map}
        place={item.place}
        selected={item.place.key === popupKey}
        active={item.place.key === selectedKey || item.place.key === hoveredKey}
        onSelect={onSelect}
      />
    ),
  )
}

export function EventsMap({
  places,
  selectedKey,
  hoveredKey,
  focus,
  searchedBox,
  origin,
  onSelect,
  onClear,
  onSearchArea,
  insets,
}: EventsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const map = useEventsMapInstance(containerRef, insets !== undefined)
  const view = useCamera(map, { places, searchedBox, insets, selectedKey, focus })
  useClosePopup(map, selectedKey, onClear)
  const movedByReader = useMovedByReader(map)
  const searchArea = (box: BoundingBox) => {
    movedByReader.reset()
    onSearchArea(box)
  }

  if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
    return (
      <div className="flex h-full items-center justify-center bg-muted text-muted-foreground">
        The map isn’t configured.
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full">
        <Pins
          map={map}
          places={places}
          selectedKey={selectedKey}
          hoveredKey={hoveredKey}
          onSelect={onSelect}
          popupKey={view.popupKey}
        />
        <OriginMarker map={map} origin={origin} />
      </div>
      <SearchAreaButton
        map={map}
        shown={movedByReader.moved}
        top={view.searchTop}
        onSearch={searchArea}
      />
    </div>
  )
}
