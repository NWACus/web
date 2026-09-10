'use client'

/**
 * The station map's state: the filters (and where they persist), what passes them, the selected
 * point, and the viewport reactions. Kept apart from the Mapbox plumbing in `./useStationMap` and
 * the layout in `StationMap.client.tsx`.
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

import {
  clearStationMapPrefs,
  readStationMapPrefs,
  readZoneParam,
  withZoneParam,
  writeStationMapPrefs,
} from './stationMapPrefs'
import { useZoneOutline, type MapView } from './useStationMap'

/** Re-derive reading ages this often, so a card left open eventually flags as stale. */
const AGE_TICK_MS = 60_000
/** Padding for framing a zone, so its outline isn't flush with the edge. */
const ZONE_FIT_PADDING = 20

/** What the data looks like before it arrives, so every consumer reads one shape. */
export const EMPTY_STATION_MAP_DATA: StationMapData = {
  stations: [],
  webcams: [],
  zones: [],
  zoneNames: [],
  variables: [],
  units: {},
  timezone: 'UTC',
  webcamsUnavailable: false,
}

// --- Filters -------------------------------------------------------------------------------------

/** The reader's saved preferences and the URL, over the defaults. */
function initialFilters(centerSlug: string): Filters {
  const prefs = readStationMapPrefs(centerSlug)
  return {
    ...DEFAULT_FILTERS,
    variable: prefs.variable ?? DEFAULT_FILTERS.variable,
    withinMinutes: prefs.withinMinutes ?? DEFAULT_FILTERS.withinMinutes,
    units: prefs.units ?? DEFAULT_FILTERS.units,
    zones: readZoneParam(window.location.search),
  }
}

/** The widget persists label, recency and units; zone rides in the URL so a filtered map links. */
function persistFilterPatch(centerSlug: string, patch: Partial<Filters>) {
  const { variable, withinMinutes, units, zones } = patch
  writeStationMapPrefs(centerSlug, { variable, withinMinutes, units })
  if (zones !== undefined) {
    const { pathname, search } = window.location
    window.history.replaceState(null, '', `${pathname}${withZoneParam(search, zones)}`)
  }
}

export function useStationMapFilters(centerSlug: string) {
  const [filters, setFilters] = useState<Filters>(() => initialFilters(centerSlug))

  const changeFilters = useCallback(
    (patch: Partial<Filters>) => {
      setFilters((current) => ({ ...current, ...patch }))
      persistFilterPatch(centerSlug, patch)
    },
    [centerSlug],
  )

  const resetFilters = useCallback(() => {
    clearStationMapPrefs(centerSlug)
    changeFilters({ ...DEFAULT_FILTERS })
  }, [centerSlug, changeFilters])

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
 * Where the map opens: the viewport the reader last left it at, else the center's configured one.
 * `remember` is the moveend handler that keeps that up to date.
 */
export function useOpeningView(centerSlug: string, settings: StationMapSettings) {
  const view = useMemo<MapView>(() => {
    const prefs = readStationMapPrefs(centerSlug)
    return { center: prefs.center ?? settings.center, zoom: prefs.zoom ?? settings.zoom }
  }, [centerSlug, settings])
  const remember = useCallback(
    (moved: MapView) => writeStationMapPrefs(centerSlug, moved),
    [centerSlug],
  )
  return { view, remember }
}

/** Return to the center's configured opening view — the widget's reset button. */
function useResetView(map: MapboxMap | null, settings: StationMapSettings) {
  return useCallback(
    (animate: boolean) => {
      map?.flyTo({
        center: [settings.center.lng, settings.center.lat],
        zoom: settings.zoom,
        animate,
      })
    },
    [map, settings],
  )
}

/**
 * Frame the chosen zones, and return to the configured view when the filter clears — the widget's
 * `panToZone`. Frames whenever there is something to frame (including when the zones first
 * arrive for a `?zone=` link); resets only on a real chosen→none transition, so neither a data
 * refresh nor the map's own mount overrides the viewport the reader left it at.
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

function frameZones(
  map: MapboxMap,
  zones: StationMapZone[],
  chosenNames: string[],
  hadChosen: boolean,
  resetView: (animate: boolean) => void,
) {
  const bounds = chosenZoneBounds(zones, chosenNames)
  if (bounds) map.fitBounds(bounds, { padding: ZONE_FIT_PADDING })
  else if (chosenNames.length === 0 && hadChosen) resetView(false)
}

/** Everything the viewport does with the zones: draw them, frame the chosen ones, reset. */
export function useZones(
  map: MapboxMap | null,
  styleReady: boolean,
  zones: StationMapZone[],
  chosenNames: string[],
  settings: StationMapSettings,
) {
  useZoneOutline(map, styleReady, zones)
  const resetView = useResetView(map, settings)
  useZoneFraming(map, zones, chosenNames, resetView)
  return resetView
}
