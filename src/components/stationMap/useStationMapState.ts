'use client'

/**
 * The station map's state: the filters (and where they live), what passes them, the selected
 * point, and the viewport reactions. Kept apart from the Mapbox plumbing in `./useStationMap` and
 * the layout in `StationMap.client.tsx`.
 *
 * The filters and the viewport live in the URL (`./stationMapUrl`) so a reader can bookmark or
 * share what they are looking at; only units is a saved preference (`./stationMapPrefs`).
 */
import type { Map as MapboxMap } from 'mapbox-gl'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  DEFAULT_FILTERS,
  chosenZoneBounds,
  dataSources,
  filterStations,
  filterWebcams,
  orderedPoints,
  type StationMapFilters as Filters,
  type MapPoint,
  type StationAges,
} from '@/services/snowobs/stationMap/filters'
import { minutesSince } from '@/services/snowobs/stationMap/format'
import type { StationMapData, StationMapZone } from '@/services/snowobs/stationMap/model'
import type { StationMapSettings } from '@/services/snowobs/stationMap/settings'
import { boundsOfGeometries, type Bounds } from '@/utilities/geo/bounds'

import { readUnitsPref, writeUnitsPref } from './stationMapPrefs'
import {
  dropViewParam,
  readFilterParams,
  readViewParam,
  writeFilterParams,
  writeViewParam,
} from './stationMapUrl'
import {
  AUTOMATED_MOVE,
  ZONE_FIT_PADDING,
  goToOpeningView,
  useZoneOutline,
  type MapView,
} from './useStationMap'

/** Re-derive reading ages this often, so a card left open eventually flags as stale. */
const AGE_TICK_MS = 60_000

/** What the data looks like before it arrives, so every consumer reads one shape. */
export const EMPTY_STATION_MAP_DATA: StationMapData = {
  stations: [],
  webcams: [],
  zones: [],
  zoneNames: [],
  outlines: [],
  variables: [],
  units: {},
  timezone: 'UTC',
  webcamsUnavailable: false,
}

// --- Filters -------------------------------------------------------------------------------------

/** What the link asks for, over the defaults, with the reader's own units. */
function initialFilters(centerSlug: string): Filters {
  const units = readUnitsPref(centerSlug) ?? DEFAULT_FILTERS.units
  return readFilterParams(window.location.search, units)
}

export function useStationMapFilters(centerSlug: string) {
  const [filters, setFilters] = useState<Filters>(() => initialFilters(centerSlug))

  const changeFilters = useCallback(
    (patch: Partial<Filters>) => {
      setFilters((current) => {
        const next = { ...current, ...patch }
        writeFilterParams(next)
        return next
      })
      if (patch.units) writeUnitsPref(centerSlug, patch.units)
    },
    [centerSlug],
  )

  // Units is held back: it is a preference rather than a filter, it is never one of the chips this
  // clears, and a reader who chose metric shouldn't lose it by dropping a zone. The viewport is
  // untouched too — it has its own control on the map.
  const resetFilters = useCallback(() => {
    const { units: _units, ...viewFilters } = DEFAULT_FILTERS
    changeFilters(viewFilters)
  }, [changeFilters])

  return { filters, changeFilters, resetFilters }
}

// --- What's visible --------------------------------------------------------------------------------

/** A clock that ticks once a minute, for the "minutes since" every reading is compared on. */
function useMinuteClock(): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), AGE_TICK_MS)
    return () => window.clearInterval(interval)
  }, [])
  return now
}

/** The stations and webcams that pass the filters, the order the panel walks them in, and their ages. */
export function useVisiblePoints(data: StationMapData, filters: Filters) {
  const now = useMinuteClock()
  const ages = useMemo<StationAges>(
    () => new Map(data.stations.map((s) => [s.stid, minutesSince(s.observedAt, now)])),
    [data, now],
  )
  const stations = useMemo(
    () => filterStations(data.stations, filters, ages),
    [data, filters, ages],
  )
  const webcams = useMemo(() => filterWebcams(data.webcams, filters), [data, filters])
  const points = useMemo(() => orderedPoints(stations, webcams), [stations, webcams])
  const sources = useMemo(() => dataSources(data.stations), [data])
  return { ages, stations, webcams, points, sources }
}

/** Which point is selected, and where it sits in the ordered list the panel walks. */
export function useSelection(points: MapPoint[]) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedIndex = selectedId ? points.findIndex((point) => point.id === selectedId) : -1

  // A point filtered out from under its selection is deselected, as the widget's info window
  // closes when its list changes — otherwise the marker would come back highlighted, and its
  // next click would open it instead of selecting it.
  useEffect(() => {
    if (selectedId && selectedIndex < 0) setSelectedId(null)
  }, [selectedId, selectedIndex])

  const step = useCallback(
    (delta: 1 | -1) => {
      const next = points[selectedIndex + delta]
      if (next) setSelectedId(next.id)
    },
    [points, selectedIndex],
  )
  const clear = useCallback(() => setSelectedId(null), [])

  return { selectedId, setSelectedId, selectedIndex, step, clear }
}

// --- The viewport ----------------------------------------------------------------------------------

/** The three elements the map is built around: its wrapper, its canvas container, the reset button. */
export function useMapRefs() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const resetRef = useRef<HTMLDivElement>(null)
  return { wrapperRef, containerRef, resetRef }
}

/**
 * Where the map opens: the viewport a link pinned, else the center's configured one.
 *
 * `remember` is the moveend handler that keeps the link up to date, and `pinned` says which of the
 * two the map got — the configured view is only a starting point until the zones arrive to frame,
 * while a pinned one is what the reader asked for and is left alone.
 */
export function useOpeningView(settings: StationMapSettings) {
  const opening = useMemo(() => {
    const pinned = readViewParam(window.location.search)
    return {
      view: pinned ?? { center: settings.center, zoom: settings.zoom },
      pinned: pinned !== null,
    }
  }, [settings])
  const remember = useCallback((moved: MapView) => writeViewParam(moved), [])
  return { ...opening, remember, unpin: dropViewParam }
}

/** What `useZones` needs of the opening view: whether a link pinned it, and how to let go. */
export interface OpeningView {
  pinned: boolean
  unpin: () => void
}

/**
 * Return to the map's opening view — the widget's reset button — and drop the viewport from the
 * link. Leaving it there would put the map back the moment the page was reloaded.
 */
function useResetView(
  map: MapboxMap | null,
  settings: StationMapSettings,
  zoneBounds: Bounds | null,
  unpin: () => void,
) {
  return useCallback(
    (animate: boolean) => {
      if (!map) return
      unpin()
      goToOpeningView(map, settings, zoneBounds, animate)
    },
    [map, settings, zoneBounds, unpin],
  )
}

/**
 * Frame the center's zones once they arrive, on a visit whose link pinned no viewport.
 *
 * The map is built before the zones are fetched, so the configured view is all it can open at, and
 * on a phone that view can cut the forecast area in half. A link that named a viewport gets it
 * exactly, and a `?zone=` link is framed by `useZoneFraming` instead.
 */
function useOpeningFrame(
  map: MapboxMap | null,
  zoneBounds: Bounds | null,
  pinned: boolean,
  chosenNames: string[],
  resetView: (animate: boolean) => void,
) {
  const framedRef = useRef(false)
  useEffect(() => {
    if (!map || pinned || framedRef.current || !zoneBounds) return
    framedRef.current = true
    if (chosenNames.length === 0) resetView(false)
  }, [map, zoneBounds, pinned, chosenNames, resetView])
}

/**
 * Frame the chosen zones, and return to the opening view when the filter clears — the widget's
 * `panToZone`. Frames whenever there is something to frame (including when the zones first
 * arrive for a `?zone=` link); resets only on a real chosen→none transition, so neither a data
 * refresh nor the map's own mount overrides the viewport the link pinned.
 */
function useZoneFraming(
  map: MapboxMap | null,
  zones: StationMapZone[],
  chosenNames: string[],
  resetView: (animate: boolean) => void,
) {
  const hadChosenRef = useRef(false)
  useEffect(() => {
    if (!map) return
    frameZones(map, zones, chosenNames, hadChosenRef.current, resetView)
    hadChosenRef.current = chosenNames.length > 0
    // `resetView` only changes with the map and settings, neither of which should re-frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, zones, chosenNames])
}

/**
 * The widget's `panToZone`: frame the chosen zones, or reset when the choice clears or includes
 * `Other` (which has no outline to frame). Nothing moves until the zones have arrived, so a
 * `?zone=` link waits for its data rather than resetting over the pinned viewport.
 */
function frameZones(
  map: MapboxMap,
  zones: StationMapZone[],
  chosenNames: string[],
  hadChosen: boolean,
  resetView: (animate: boolean) => void,
) {
  const bounds = chosenZoneBounds(zones, chosenNames)
  if (bounds) map.fitBounds(bounds, { padding: ZONE_FIT_PADDING }, AUTOMATED_MOVE)
  else if (shouldReset(zones, chosenNames, hadChosen)) resetView(false)
}

/** A choice just cleared, or a choice with nothing to frame once the zones are known. */
function shouldReset(zones: StationMapZone[], chosenNames: string[], hadChosen: boolean): boolean {
  if (hadChosen) return true
  return chosenNames.length > 0 && zones.length > 0
}

/**
 * Everything the viewport does with zones: draw the outlines, frame the chosen grouping zones,
 * reset. The two sets differ for a center with alternate zones — the widget draws the forecast
 * zones and frames its own.
 */
export function useZones(
  map: MapboxMap | null,
  styleReady: boolean,
  view: Pick<StationMapData, 'zones' | 'outlines'>,
  chosenNames: string[],
  settings: StationMapSettings,
  opening: OpeningView,
) {
  useZoneOutline(map, styleReady, view.outlines)
  // The drawn forecast zones, not the grouping zones: those are what a reader means by "the
  // forecast area", and for a center with alternate zones they are the ones on screen.
  const zoneBounds = useMemo(
    () => boundsOfGeometries(view.outlines.map((zone) => zone.geometry)),
    [view.outlines],
  )
  const resetView = useResetView(map, settings, zoneBounds, opening.unpin)
  useOpeningFrame(map, zoneBounds, opening.pinned, chosenNames, resetView)
  useZoneFraming(map, view.zones, chosenNames, resetView)
  return resetView
}
