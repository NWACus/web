'use client'

/**
 * The native weather station map.
 *
 * Mapbox GL only runs in a browser, so this is a client component and it fetches its stations on
 * mount rather than receiving them from the (statically generated) page — a map of current
 * conditions is worth having only if the readings on it are current, and that is what the legacy
 * widget's fetch-per-page-load gave readers.
 *
 * The rules — which stations show, what order the panel walks them in, how a reading is labelled —
 * live in `src/services/snowobs/stationMap/` as pure functions; the Mapbox plumbing in
 * `./useStationMap`; the state in `./useStationMapState`; the click handling in
 * `./usePointInteractions`. What's left here is wiring and layout.
 */
import type { Map as MapboxMap } from 'mapbox-gl'
import type { RefObject } from 'react'
import { useMemo } from 'react'

import {
  SHOW_ALL_VARIABLE,
  type StationMapFilters as Filters,
  type MapPoint,
  type StationAges,
} from '@/services/snowobs/stationMap/filters'
import type {
  StationMapData,
  StationMapStation,
  StationMapWebcam,
} from '@/services/snowobs/stationMap/model'
import type { StationMapSettings } from '@/services/snowobs/stationMap/settings'

import { InfoPanel } from './InfoPanel'
import { MapStatus } from './MapStatus'
import { StationLegend } from './StationLegend'
import { StationList } from './StationList'
import { StationMapControls } from './StationMapControls'
import { StationMapFilters } from './StationMapFilters'
import { StationMarkers } from './StationMarkers'
import { usePointInteractions, useTrack } from './usePointInteractions'
import { useMapInstance, useStationMapData } from './useStationMap'
import {
  EMPTY_STATION_MAP_DATA,
  useMapRefs,
  useOpeningView,
  useSelection,
  useStationMapFilters,
  useVisiblePoints,
  useZones,
} from './useStationMapState'

export interface StationMapProps {
  centerSlug: string
  settings: StationMapSettings
  /** The table view to link to from the toolbar, when this center has one. */
  tableHref: string | null
}

export function StationMap(props: StationMapProps) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (!token) {
    // Without a token Mapbox renders a blank grey box and logs an auth error; say so instead.
    return (
      <div className="flex h-64 w-full items-center justify-center rounded border text-sm text-muted-foreground">
        The station map is not configured for this site.
      </div>
    )
  }
  return <ConfiguredStationMap {...props} token={token} />
}

/** Everything the map surface renders from, gathered once so the layout below stays flat. */
interface Surface {
  map: MapboxMap | null
  wrapperRef: RefObject<HTMLDivElement | null>
  containerRef: RefObject<HTMLDivElement | null>
  resetRef: RefObject<HTMLDivElement | null>
  data: StationMapData | null
  view: StationMapData
  failed: boolean
  loading: boolean
  unsupported: boolean
  settings: StationMapSettings
  filters: Filters
  stations: StationMapStation[]
  webcams: StationMapWebcam[]
  points: MapPoint[]
  sources: string[]
  ages: StationAges
  selectedId: string | null
  selectedIndex: number
  onReset: () => void
  onToggleSource: (source: string) => void
  onClickPoint: (point: MapPoint) => void
  onStep: (delta: 1 | -1) => void
  onClose: () => void
}

function ConfiguredStationMap({
  centerSlug,
  settings,
  tableHref,
  token,
}: StationMapProps & { token: string }) {
  const track = useTrack()
  const refs = useMapRefs()

  const { filters, changeFilters, resetFilters } = useStationMapFilters(centerSlug)
  const { data, failed, loading } = useStationMapData(centerSlug, filters.units)
  const view = data ?? EMPTY_STATION_MAP_DATA

  const opening = useOpeningView(centerSlug, settings)
  const { map, styleReady, unsupported } = useMapInstance(
    refs,
    token,
    opening.view,
    opening.remember,
  )
  const resetView = useZones(map, styleReady, view.zones, filters.zones, settings)

  const visible = useVisiblePoints(view, filters)
  const selection = useSelection(visible.points)
  const { clickPoint, searchSelect } = usePointInteractions({
    map,
    wrapperRef: refs.wrapperRef,
    selection,
    track,
  })
  const handlers = useTrackedHandlers({ resetView, changeFilters, resetFilters, filters, track })

  const surface: Surface = {
    map,
    ...refs,
    data,
    view,
    failed,
    loading,
    unsupported,
    settings,
    filters,
    ...visible,
    selectedId: selection.selectedId,
    selectedIndex: selection.selectedIndex,
    onReset: handlers.resetMap,
    onToggleSource: handlers.toggleSource,
    onClickPoint: clickPoint,
    onStep: selection.step,
    onClose: selection.clear,
  }

  return (
    <div className="flex flex-col gap-2">
      <StationMapFilters
        filters={filters}
        onChange={changeFilters}
        onReset={handlers.resetFilters}
        variables={view.variables}
        zoneNames={view.zoneNames}
        visibleCount={visible.stations.length}
        searchPoints={visible.points}
        onSearchSelect={searchSelect}
        tableHref={tableHref}
      />
      <MapSurface surface={surface} />
    </div>
  )
}

/** The handlers that also report to analytics, named as the widget named its events. */
function useTrackedHandlers({
  resetView,
  changeFilters,
  resetFilters,
  filters,
  track,
}: {
  resetView: (animate: boolean) => void
  changeFilters: (patch: Partial<Filters>) => void
  resetFilters: () => void
  filters: Filters
  track: (name: string) => void
}) {
  return useMemo(
    () => ({
      resetMap: () => {
        resetView(true)
        track('Map » Reset Map Center/Zoom')
      },
      toggleSource: (source: string) => {
        changeFilters({ source: filters.source === source ? null : source })
        track('Filter » Data Source')
      },
      resetFilters: () => {
        resetFilters()
        track('Settings » Reset Filters')
      },
    }),
    [resetView, changeFilters, resetFilters, filters.source, track],
  )
}

function Legend({ surface }: { surface: Surface }) {
  if (!surface.settings.sourceLegend) return null
  return (
    <StationLegend
      sources={surface.sources}
      active={surface.filters.source}
      colorBySource={surface.settings.sourceMarkerColor}
      onToggle={surface.onToggleSource}
    />
  )
}

function Markers({ surface }: { surface: Surface }) {
  if (!surface.map) return null
  const { variable } = surface.filters
  return (
    <StationMarkers
      map={surface.map}
      stations={surface.stations}
      webcams={surface.webcams}
      selectedId={surface.selectedId}
      labelVariable={variable === SHOW_ALL_VARIABLE ? null : variable}
      colorBySource={surface.settings.sourceMarkerColor}
      onClick={surface.onClickPoint}
    />
  )
}

function SelectedPanel({ surface }: { surface: Surface }) {
  if (surface.selectedIndex < 0) return null
  const { view } = surface
  return (
    <InfoPanel
      points={surface.points}
      index={surface.selectedIndex}
      context={{
        variables: view.variables,
        units: view.units,
        timezone: view.timezone,
        displayUnits: surface.filters.units,
        staleAfterMinutes: surface.settings.within,
      }}
      ages={surface.ages}
      onStep={surface.onStep}
      onClose={surface.onClose}
    />
  )
}

/** The map and everything laid over it: controls, legend, markers, the info panel, status. */
function MapSurface({ surface }: { surface: Surface }) {
  return (
    <div
      ref={surface.wrapperRef}
      // `isolate` keeps the overlays' z-indexes inside the map: without it the info panel and
      // legend (and the selected marker, raised above its neighbours) would also clear the
      // sticky site header on phones.
      className="relative isolate h-[calc(100dvh-14rem)] min-h-[420px] w-full overflow-hidden bg-neutral-100"
      data-testid="station-map"
    >
      <div ref={surface.containerRef} className="h-full w-full" />
      <StationMapControls resetRef={surface.resetRef} onReset={surface.onReset} />
      <Legend surface={surface} />
      <Markers surface={surface} />
      <SelectedPanel surface={surface} />
      <MapStatus
        data={surface.data}
        failed={surface.failed}
        loading={surface.loading}
        unsupported={surface.unsupported}
      />
      <StationList
        stations={surface.stations}
        variables={surface.view.variables}
        units={surface.view.units}
        visible={surface.unsupported}
      />
    </div>
  )
}
