'use client'

/**
 * The native observation viewer — the legacy observations widget's Observations and Avalanches
 * tabs (inventory rows O1, O2, O4, O6, O11, O12), on AvyWeb's design system.
 *
 * Client-only: the list shows what is inside the map (O11), so it can't be fetched until the map
 * knows its viewport. The rules live elsewhere — the filter model and its two encodings in
 * `@/services/nac/observations/`, the Mapbox plumbing in `./map/`, the URL in `./useViewerFilters`
 * and `./useViewerLocation` — and what is left here is wiring and layout.
 */
import { ArrowUp } from 'lucide-react'
import type { RefObject } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { Button } from '@/components/ui/button'
import type { ObservationKind } from '@/services/nac/model/observation'
import { activeTags, type ListState } from '@/services/nac/observations/filters'
import { detailPath } from '@/services/nac/observations/routes'
import type { ObservationViewerSettings } from '@/services/nac/observations/viewerSettings'
import { cn } from '@/utilities/ui'

import { DetailModal } from './detail/DetailModal'
import { DateFilter } from './filters/DateFilter'
import { FilterSheet } from './filters/FilterSheet'
import { FilterTags } from './filters/FilterTags'
import { PlaceSearch } from './filters/PlaceSearch'
import { SortMenu } from './filters/SortMenu'
import { ZoneFilter } from './filters/ZoneFilter'
import { ObservationList } from './list/ObservationList'
import { MapControls } from './map/MapControls'
import { MapLegend } from './map/MapLegend'
import { MapNotices } from './map/MapNotices'
import { MarkerList } from './map/MarkerList'
import { MarkerPopup } from './map/MarkerPopup'
import { usePlaceMarker, useZoneFraming } from './map/useMapPlace'
import { useMarkerInteractions } from './map/useMarkerInteractions'
import { useMarkerLayers } from './map/useMarkerLayers'
import { useObservationMap, useResetView } from './map/useObservationMap'
import { useZoneOutlines } from './map/useZoneOutlines'
import { ZoneHoverCard } from './map/ZoneHoverCard'
import { useObservationList, type ListStatus } from './useObservationList'
import { useScrolledPast } from './useScrolledPast'
import { useStickyHeaderHeight } from './useStickyHeaderHeight'
import { neighboursOf, resultCount, useViewerState, type ViewerState } from './useViewerState'
import { ViewerTabs } from './ViewerTabs'

export interface ObservationViewerProps {
  centerSlug: string
  settings: ObservationViewerSettings
  initialTab: ObservationKind
}

/** A shared link's page can outlive its matches; the server then serves page 1, and so do we. */
function useServedPage(status: ListStatus, setList: (patch: Partial<ListState>) => void) {
  const servedPage = status.state === 'ready' ? status.data.page : null
  useEffect(() => {
    if (servedPage !== null) setList({ page: servedPage })
  }, [servedPage, setList])
}

/** The map, and everything drawn on it or fetched for it: markers, outlines, the list. */
function useViewerMap(centerSlug: string, state: ViewerState, token: string | null) {
  const containerRef = useRef<HTMLDivElement>(null)
  const controlsRef = useRef<HTMLDivElement>(null)
  const { settings, tab } = state
  const view = useObservationMap({ containerRef, controlsRef }, token, settings)
  const status = useObservationList({
    centerSlug,
    kind: tab,
    search: state.apiSearch,
    bbox: view.bbox,
  })
  useServedPage(status, state.setList)

  const hoveredZone = useZoneOutlines(view.map, view.styleReady, centerSlug, settings.allZones)
  const { tilesFailed } = useMarkerLayers({
    map: view.map,
    styleReady: view.styleReady,
    centerSlug,
    kind: tab,
    filters: state.filters,
    centerId: settings.centerId,
    highlightedId: state.highlightedId,
  })
  useZoneFraming(view.map, state.chosenZones)
  const { setPlace, openRecord } = state
  usePlaceMarker(view.map, state.place, () => setPlace(null))
  const resetView = useResetView(view.map, settings, state.chosenZones)

  const open = useCallback((id: string) => openRecord({ kind: tab, id }), [openRecord, tab])
  const interactions = useMarkerInteractions({
    map: view.map,
    kind: tab,
    onOpen: open,
    onHighlight: state.setHighlightedId,
  })
  return {
    containerRef,
    controlsRef,
    ...view,
    status,
    tilesFailed,
    hoveredZone,
    resetView,
    open,
    interactions,
  }
}

type ViewerMap = ReturnType<typeof useViewerMap>

function hrefFor(prefix: string, kind: ObservationKind) {
  return (id: string) => `${prefix}${detailPath(kind, id)}`
}

function Toolbar({ state, status }: { state: ViewerState; status: ListStatus }) {
  const { filters, tab, today, settings } = state
  return (
    <div className="flex flex-wrap items-center gap-2">
      <DateFilter
        filters={filters}
        today={today}
        startSeason={settings.startSeason}
        onChange={state.changeFilters}
      />
      <SortMenu kind={tab} list={state.list} onChange={state.setList} />
      <FilterSheet
        kind={tab}
        filters={filters}
        today={today}
        zones={settings.zones}
        centerLabel={settings.centerLabel}
        activeCount={activeTags(filters, tab, today).length}
        resultCount={resultCount(tab, status)}
        onChange={state.changeFilters}
        onRemoveTag={state.removeFilterTag}
        onResetAll={state.resetAll}
      />
      {settings.showZoneFilter && (
        <ZoneFilter
          kind={tab}
          filters={filters}
          zones={settings.zones}
          centerLabel={settings.centerLabel}
          onChange={(patch) => {
            state.setPlace(null)
            state.changeFilters(patch)
          }}
        />
      )}
    </div>
  )
}

function ViewerHeader({
  state,
  view,
  token,
}: {
  state: ViewerState
  view: ViewerMap
  token: string | null
}) {
  const { map } = view
  return (
    <div className="flex flex-col-reverse gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <Toolbar state={state} status={view.status} />
        <PlaceSearch
          token={token ?? ''}
          chosen={state.place}
          proximity={() => map && map.getCenter().toArray()}
          onChoose={(place) => {
            state.changeFilters({ zones: [] })
            state.setPlace(place)
          }}
          onClear={() => state.setPlace(null)}
        />
      </div>
      <ViewerTabs
        active={state.tab}
        prefix={state.prefix}
        search={state.listSearch}
        onSelect={state.openTab}
      />
    </div>
  )
}

interface PaneProps {
  state: ViewerState
  view: ViewerMap
  expanded: boolean
}

function MapPane({
  state,
  view,
  token,
  expanded,
  onToggleExpanded,
  headerHeight,
}: PaneProps & { token: string | null; onToggleExpanded: () => void; headerHeight: number }) {
  return (
    <div
      // Below `lg` the map holds still while the list slides up over it (O6); from `lg` it is the
      // right-hand column. It pins under the site's sticky header, however tall that is.
      style={{ top: headerHeight }}
      className="sticky z-0 -mx-4 h-[400px] overflow-hidden lg:static lg:order-2 lg:mx-0 lg:h-full lg:rounded-lg lg:border"
    >
      <div className="relative isolate h-full w-full bg-neutral-100" data-testid="observation-map">
        <div ref={view.containerRef} className="h-full w-full" />
        <MapControls
          controlsRef={view.controlsRef}
          onReset={view.resetView}
          expanded={expanded}
          onToggleExpanded={onToggleExpanded}
        />
        <MapLegend kind={state.tab} />
        <ZoneHoverCard zone={view.hoveredZone} />
        <MapNotices
          unsupported={view.unsupported}
          unconfigured={token === null}
          styleFailed={view.styleFailed}
          tilesFailed={view.tilesFailed}
        />
        <MarkerList
          map={view.map}
          kind={state.tab}
          hrefFor={hrefFor(state.prefix, state.tab)}
          onOpen={view.open}
        />
      </div>
    </div>
  )
}

function ListPane({
  state,
  view,
  expanded,
  listRef,
}: PaneProps & { listRef: RefObject<HTMLDivElement | null> }) {
  const { filters, settings } = state
  return (
    <div
      ref={listRef}
      className={cn(
        'relative z-10 -mx-4 -mt-4 flex flex-col gap-3 rounded-t-2xl bg-background px-4 pb-6 pt-4 shadow-[0_-4px_12px_rgba(0,0,0,0.15)]',
        'lg:order-1 lg:mx-0 lg:mt-0 lg:overflow-y-auto lg:rounded-none lg:px-0 lg:pt-0 lg:shadow-none',
        expanded && 'lg:hidden',
      )}
    >
      <FilterTags
        kind={state.tab}
        filters={filters}
        today={state.today}
        zones={settings.zones}
        centerLabel={settings.centerLabel}
        onRemove={state.removeFilterTag}
        onClearAll={state.resetAll}
      />
      <ObservationList
        kind={state.tab}
        status={view.status}
        scope={{ place: state.place && state.place.label, zoneCount: filters.zones.length }}
        highlightedId={state.highlightedId}
        hrefFor={hrefFor(state.prefix, state.tab)}
        onOpen={view.open}
        onHighlight={state.setHighlightedId}
        onPage={(page) => state.setList({ page })}
      />
    </div>
  )
}

/** The phone layout's "↑ Map", once the list has covered the map. */
function BackToMap({
  shown,
  target,
}: {
  shown: boolean
  target: RefObject<HTMLDivElement | null>
}) {
  if (!shown) return null
  return (
    <Button
      type="button"
      className="fixed bottom-4 left-1/2 z-30 -translate-x-1/2 gap-1 shadow-lg lg:hidden"
      onClick={() => target.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
    >
      <ArrowUp className="h-4 w-4" aria-hidden="true" />
      Map
    </Button>
  )
}

/** The hovered or tapped marker's card, rendered into the Mapbox popup's own element. */
function MarkerPopupPortal({ state, view }: { state: ViewerState; view: ViewerMap }) {
  const { popup, popupNode, closePopup } = view.interactions
  if (!popup) return null
  const href = popup.tapped ? hrefFor(state.prefix, state.tab)(popup.id) : null
  return createPortal(
    <MarkerPopup
      kind={state.tab}
      properties={popup.properties}
      href={href}
      onOpen={() => {
        closePopup()
        view.open(popup.id)
      }}
    />,
    popupNode,
  )
}

export function ObservationViewer({ centerSlug, settings, initialTab }: ObservationViewerProps) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || null
  const state = useViewerState(settings, initialTab)
  const view = useViewerMap(centerSlug, state, token)
  const layoutRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(false)
  const headerHeight = useStickyHeaderHeight()
  const scrolledPastMap = useScrolledPast(listRef, headerHeight)
  const toggleExpanded = () => {
    setExpanded((value) => !value)
    // The map's container changes size with the list; Mapbox has to be told.
    window.setTimeout(() => view.map?.resize(), 0)
  }

  return (
    <div className="flex flex-col gap-3" data-testid="observation-viewer">
      <ViewerHeader state={state} view={view} token={token} />
      <div
        ref={layoutRef}
        style={{ scrollMarginTop: headerHeight }}
        className={cn(
          'flex flex-col lg:grid lg:h-[calc(100dvh-11rem)] lg:min-h-[560px] lg:gap-4',
          expanded ? 'lg:grid-cols-1' : 'lg:grid-cols-2',
        )}
      >
        <MapPane
          state={state}
          view={view}
          token={token}
          expanded={expanded}
          onToggleExpanded={toggleExpanded}
          headerHeight={headerHeight}
        />
        <ListPane state={state} view={view} expanded={expanded} listRef={listRef} />
      </div>
      <BackToMap shown={scrolledPastMap} target={layoutRef} />
      <MarkerPopupPortal state={state} view={view} />
      <DetailModal
        centerSlug={centerSlug}
        timezone={settings.timezone}
        prefix={state.prefix}
        record={state.detail}
        neighbours={neighboursOf(view.status, state.detail, state.tab)}
        onOpen={state.openRecord}
        onClose={() => state.closeRecord(state.listSearch)}
      />
    </div>
  )
}
