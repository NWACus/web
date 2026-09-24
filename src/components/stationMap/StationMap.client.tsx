'use client'

/**
 * The native weather station map, and its table view.
 *
 * Mapbox GL only runs in a browser, so this is a client component and it fetches its stations on
 * mount rather than receiving them from the (statically generated) page — a map of current
 * conditions is worth having only if the readings on it are current, and that is what the legacy
 * widget's fetch-per-page-load gave readers.
 *
 * The rules — which stations show, what order the panel walks them in, how a reading is labelled —
 * live in `src/services/snowobs/stationMap/` as pure functions; the Mapbox plumbing in
 * `./useStationMap`; the state in `./useStationMapState` and `./useStationTableState`; the click
 * handling in `./usePointInteractions`. What's left here is wiring and layout.
 */
import type { Map as MapboxMap } from 'mapbox-gl'
import { useRouter } from 'next/navigation'
import type { RefObject } from 'react'
import { useCallback, useMemo, useRef, useState } from 'react'

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
import { hasThresholdColumns, readingColumns } from '@/services/snowobs/stationMap/table'

import type { ColorRulesToggle } from './FilterOptions'
import { InfoPanel } from './InfoPanel'
import { MapStatus } from './MapStatus'
import { StationLegend } from './StationLegend'
import { StationList } from './StationList'
import { StationMapControls } from './StationMapControls'
import { StationMapFilters, type StationMapFiltersProps } from './StationMapFilters'
import type { StationMapDisplay } from './stationMapUrl'
import { StationMarkers } from './StationMarkers'
import { StationTable } from './StationTable'
import { TableStatus } from './TableStatus'
import { usePointInteractions, useTrack } from './usePointInteractions'
import { useMapInstance, useStationMapData } from './useStationMap'
import {
  EMPTY_STATION_MAP_DATA,
  useMapRefs,
  useOpeningView,
  useSelection,
  useStationMapDisplay,
  useStationMapFilters,
  useVisiblePoints,
  useZones,
} from './useStationMapState'
import { useStationTableState, type StationTableState } from './useStationTableState'

export interface StationMapProps {
  centerSlug: string
  settings: StationMapSettings
}

export function StationMap(props: StationMapProps) {
  return <ConfiguredStationMap {...props} token={process.env.NEXT_PUBLIC_MAPBOX_TOKEN} />
}

/** Without a token Mapbox renders a blank grey box and logs an auth error; say so instead. */
function MapNotConfigured() {
  return (
    <div className="flex h-64 w-full items-center justify-center rounded border text-sm text-muted-foreground">
      The station map is not configured for this site.
    </div>
  )
}

/** What both views share: the data, the filters, what passes them, and the toolbar's props. */
interface SharedView {
  settings: StationMapSettings
  data: StationMapData | null
  view: StationMapData
  failed: boolean
  loading: boolean
  filters: Filters
  changeFilters: (patch: Partial<Filters>) => void
  visible: ReturnType<typeof useVisiblePoints>
  track: (name: string) => void
  /** Everything the toolbar takes but the search, which each view answers its own way. */
  toolbar: Omit<StationMapFiltersProps, 'searchPoints' | 'onSearchSelect'>
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

/**
 * The state both views read, and the one that is showing. The map is only mounted while it shows,
 * so a reader who came for the table never starts a (billable) Mapbox map or fetches its tiles.
 */
function ConfiguredStationMap({
  centerSlug,
  settings,
  token,
}: StationMapProps & { token: string | undefined }) {
  const track = useTrack()
  const { filters, changeFilters, resetFilters } = useStationMapFilters(centerSlug)
  const { data, failed, loading } = useStationMapData(centerSlug, filters.units)
  const view = data ?? EMPTY_STATION_MAP_DATA
  const visible = useVisiblePoints(view, filters)
  const { display, changeDisplay, legacyHighlight } = useStationMapDisplay()
  const table = useStationTableState(centerSlug, legacyHighlight)
  const handlers = useSharedHandlers({
    resetFilters,
    table,
    changeDisplay,
    track,
  })

  const shared: SharedView = {
    settings,
    data,
    view,
    failed,
    loading,
    filters,
    changeFilters,
    visible,
    track,
    toolbar: {
      filters,
      onChange: changeFilters,
      onReset: handlers.resetFilters,
      tableChanged: table.changed,
      variables: view.variables,
      zoneNames: view.zoneNames,
      visibleCounts: { stations: visible.stations.length, webcams: visible.webcams.length },
      display,
      onDisplayChange: handlers.changeDisplay,
      focusDisplayToggle: handlers.toggled,
      colorRules: colorRulesToggle(settings, view, table, handlers.changeColorRules),
    },
  }

  if (display === 'table') return <TableView shared={shared} table={table} />
  return token ? <MapView shared={shared} token={token} /> : <MapNotConfigured />
}

/**
 * The color-rules switch, where it would do anything: the center turned the rules on, and some
 * column is in the units they were written in — the widget hid it for metric readers. Offered in
 * both views, as the widget's Settings menu offered it.
 */
function colorRulesToggle(
  settings: StationMapSettings,
  view: StationMapData,
  table: StationTableState,
  onChange: (on: boolean) => void,
): ColorRulesToggle | null {
  if (!settings.colorRules) return null
  if (!hasThresholdColumns(readingColumns(view.variables), view.units)) return null
  return { on: table.colorRulesOn, onChange }
}

/**
 * The handlers both views use that also report to analytics. Where the widget had an event they
 * carry its name; the Map/Table switch was a pageview there, and gets an event of its own here.
 */
function useSharedHandlers({
  resetFilters,
  table,
  changeDisplay,
  track,
}: {
  resetFilters: () => void
  table: StationTableState
  changeDisplay: (display: StationMapDisplay) => void
  track: (name: string) => void
}) {
  // Each view renders its own toolbar, so the switch the reader pressed is replaced by the other
  // view's; this hands focus to the new one rather than dropping it to the page.
  const [toggled, setToggled] = useState(false)
  const { reset: resetTable, changeColorRules } = table
  const handlers = useMemo(
    () => ({
      resetFilters: () => {
        resetFilters()
        resetTable()
        track('Settings » Reset Filters')
      },
      changeDisplay: (next: StationMapDisplay) => {
        changeDisplay(next)
        setToggled(true)
        track(next === 'table' ? 'Map » Show Table' : 'Table » Show Map')
      },
      changeColorRules: (on: boolean) => {
        changeColorRules(on)
        track('Settings » Color Rules Toggle')
      },
    }),
    [resetFilters, resetTable, changeColorRules, changeDisplay, track],
  )
  return { ...handlers, toggled }
}

// --- The map -------------------------------------------------------------------------------------

function MapView({ shared, token }: { shared: SharedView; token: string }) {
  const { settings, view, filters, visible, track } = shared
  const refs = useMapRefs()
  const opening = useOpeningView(settings)
  const { map, styleReady, unsupported } = useMapInstance(
    refs,
    token,
    opening.view,
    opening.remember,
  )
  const resetView = useZones(map, styleReady, view, filters.zones, settings, opening)

  const selection = useSelection(visible.points)
  const { clickPoint, searchSelect } = usePointInteractions({
    map,
    wrapperRef: refs.wrapperRef,
    selection,
    track,
  })
  const handlers = useMapHandlers({
    resetView,
    changeFilters: shared.changeFilters,
    filters,
    track,
  })

  const surface: Surface = {
    map,
    ...refs,
    data: shared.data,
    view,
    failed: shared.failed,
    loading: shared.loading,
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
    // Below `md` the map runs edge to edge (the container pads 1rem there); above, it stays inside
    // the container like the station tables, with room before the footer.
    <div className="flex flex-col gap-2 md:mb-8">
      <StationMapFilters
        {...shared.toolbar}
        searchPoints={visible.points}
        onSearchSelect={searchSelect}
      />
      <MapSurface surface={surface} />
    </div>
  )
}

/** The map's own handlers that also report to analytics. */
function useMapHandlers({
  resetView,
  changeFilters,
  filters,
  track,
}: {
  resetView: (animate: boolean) => void
  changeFilters: (patch: Partial<Filters>) => void
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
    }),
    [resetView, changeFilters, filters.source, track],
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
  const { view } = surface
  return (
    <InfoPanel
      points={surface.points}
      index={surface.selectedIndex}
      context={{
        variables: view.variables,
        units: view.units,
        timezone: view.timezone,
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
      className="relative isolate -mx-4 h-[calc(100dvh-14rem)] min-h-[420px] overflow-hidden bg-neutral-100 md:mx-0"
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

// --- The table -----------------------------------------------------------------------------------

/**
 * The table's search, as the widget's: picking a station picks out its row, picking the same
 * station again opens it, and clearing the search lets the row go. Webcams have no row, so the
 * search offers only stations here.
 */
function useTableSearch(shared: SharedView, table: StationTableState) {
  const router = useRouter()
  const { track } = shared
  const { highlighted, setHighlighted } = table
  const points = useMemo(
    () => shared.visible.points.filter((point) => point.kind === 'station'),
    [shared.visible.points],
  )
  const select = useCallback(
    (point: MapPoint) => {
      if (point.kind !== 'station') return
      const { station } = point
      track('Filters » Station Search Click')
      if (station.stid !== highlighted) {
        setHighlighted(station.stid)
      } else if (station.href) {
        track('Table » Open Station')
        router.push(station.href)
      }
    },
    [highlighted, setHighlighted, track, router],
  )
  const clear = useCallback(() => setHighlighted(null), [setHighlighted])
  return { points, select, clear }
}

function TableView({ shared, table }: { shared: SharedView; table: StationTableState }) {
  const { view, visible, settings, track } = shared
  const frameRef = useRef<HTMLDivElement>(null)
  const search = useTableSearch(shared, table)

  const onReset = () => {
    shared.toolbar.onReset()
    frameRef.current?.scrollTo({ top: 0, left: 0 })
  }
  const onSort = (column: string) => {
    const next = table.sortBy(column)
    track(`Table » Sort ${next.column} ${next.direction}`)
  }

  return (
    <div className="flex flex-col gap-2 md:mb-8">
      <StationMapFilters
        {...shared.toolbar}
        onReset={onReset}
        searchPoints={search.points}
        onSearchSelect={search.select}
        onSearchClear={search.clear}
      />
      <TableStatus
        data={shared.data}
        failed={shared.failed}
        loading={shared.loading}
        visibleCount={visible.stations.length}
      />
      {visible.stations.length > 0 && (
        <StationTable
          stations={visible.stations}
          context={{
            variables: view.variables,
            units: view.units,
            zoneNames: view.zoneNames,
            timezone: view.timezone,
            ages: visible.ages,
            staleAfterMinutes: settings.within,
            colorRules: shared.toolbar.colorRules?.on ?? false,
          }}
          sort={table.sort}
          onSort={onSort}
          highlighted={table.highlighted}
          onOpenStation={() => track('Table » Open Station')}
          frameRef={frameRef}
        />
      )}
    </div>
  )
}
