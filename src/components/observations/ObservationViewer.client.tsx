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
import { Map as MapIcon } from 'lucide-react'
import type { ReactNode, RefObject } from 'react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
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
import { useStickyHeaderHeight } from './useStickyHeaderHeight'
import { useViewerLayout } from './useViewerLayout'
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
    moving: view.moving,
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
  useZoneFraming(view.map, state.chosenZones, view.expectMove)
  const { setPlace, openRecord } = state
  usePlaceMarker(view.map, state.place, () => setPlace(null), view.expectMove)
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
type ViewerLayout = ReturnType<typeof useViewerLayout>

function hrefFor(prefix: string, kind: ObservationKind) {
  return (id: string) => `${prefix}${detailPath(kind, id)}`
}

function Toolbar({ state, status }: { state: ViewerState; status: ListStatus }) {
  const { filters, tab, today, settings } = state
  return (
    <div className="flex flex-wrap items-center gap-2">
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
      <DateFilter
        filters={filters}
        today={today}
        startSeason={settings.startSeason}
        onChange={state.changeFilters}
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
        search={state.tabSearch}
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
}: PaneProps & { token: string | null; onToggleExpanded: () => void }) {
  return (
    <div
      // The phone layout's map fills the frame under the list; side by side it pins under the bar
      // and fills the rest of the window while the page scrolls the list.
      className="absolute inset-0 lg:sticky lg:top-[var(--view-bar)] lg:order-2 lg:h-[calc(100dvh-var(--view-bar)-1rem)] lg:min-h-[400px] lg:overflow-hidden lg:rounded-lg lg:border"
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

/**
 * The list. In the phone layout it is a sheet in a scroller over the whole map, resting
 * `restingTop` down and taking touches only on itself; side by side it is the left-hand column and
 * scrolls with the page.
 */
function ListPane({
  state,
  view,
  expanded,
  layout,
  scrollerRef,
  listRef,
}: PaneProps & {
  layout: ViewerLayout
  scrollerRef: RefObject<HTMLDivElement | null>
  listRef: RefObject<HTMLDivElement | null>
}) {
  const { filters, settings } = state
  return (
    <div
      ref={scrollerRef}
      className={cn(
        'pointer-events-none absolute inset-0 z-10 overflow-y-auto overscroll-contain',
        'lg:pointer-events-auto lg:static lg:order-1 lg:overflow-visible',
        expanded && 'lg:hidden',
      )}
    >
      <div aria-hidden="true" className="lg:hidden" style={{ height: layout.restingTop }} />
      <div
        ref={listRef}
        className={cn(
          'pointer-events-auto relative flex min-h-full flex-col gap-3 rounded-t-2xl bg-background px-4 pb-24 pt-2 shadow-[0_-4px_16px_rgba(0,0,0,0.15)] md:px-8',
          'lg:min-h-0 lg:rounded-none lg:px-0 lg:pb-6 lg:pt-0 lg:shadow-none',
        )}
      >
        <div
          aria-hidden="true"
          className="mx-auto h-1.5 w-10 rounded-full bg-neutral-300 lg:hidden"
        />
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
          onPage={(page) => {
            state.setList({ page })
            layout.revealList()
          }}
        />
      </div>
    </div>
  )
}

/** The phone layout's "Map", once the list has covered the map. */
function BackToMap({ layout }: { layout: ViewerLayout }) {
  if (!layout.listCoversMap) return null
  return (
    <Button
      type="button"
      className="absolute bottom-5 left-1/2 z-20 -translate-x-1/2 gap-1 rounded-full shadow-lg lg:hidden"
      onClick={layout.showMap}
    >
      <MapIcon className="h-4 w-4" aria-hidden="true" />
      Map
    </Button>
  )
}

/**
 * Side by side, the toolbar sticks under the top of the window. It sticks within a track that ends
 * one map height above the viewer's end, so at the end of a short list the bar and the map let go
 * together rather than the map sliding up under the bar. A shadow over the list column marks cards
 * scrolled beneath it.
 */
function StickyBar({
  barRef,
  scrolledUnder,
  expanded,
  children,
}: {
  barRef: RefObject<HTMLDivElement | null>
  scrolledUnder: boolean
  expanded: boolean
  children: ReactNode
}) {
  return (
    <div className="shrink-0 lg:h-[var(--view-bar)]">
      <div className="lg:pointer-events-none lg:absolute lg:inset-x-0 lg:top-0 lg:bottom-[calc(100dvh-var(--view-bar)-1rem)]">
        <div
          ref={barRef}
          className="relative bg-background pb-3 lg:pointer-events-auto lg:sticky lg:top-0 lg:z-20"
        >
          {children}
          <div
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute left-0 top-full hidden h-3 w-[calc(50%-0.5rem)] bg-[linear-gradient(to_bottom,rgba(0,0,0,0.12),transparent)] opacity-0 transition-opacity lg:block',
              scrolledUnder && 'opacity-100',
              expanded && 'lg:hidden',
            )}
          />
        </div>
      </div>
    </div>
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

/** The map and the list: stacked under the bar on a phone, side by side from `lg`. */
function ViewerFrame({
  state,
  view,
  token,
  layout,
  refs,
  expanded,
  onToggleExpanded,
}: PaneProps & {
  token: string | null
  layout: ViewerLayout
  refs: {
    frameRef: RefObject<HTMLDivElement | null>
    scrollerRef: RefObject<HTMLDivElement | null>
    listRef: RefObject<HTMLDivElement | null>
  }
  onToggleExpanded: () => void
}) {
  return (
    <div
      ref={refs.frameRef}
      className={cn(
        'relative -mx-4 min-h-0 flex-1 overflow-hidden md:-mx-8',
        'lg:mx-0 lg:grid lg:items-start lg:gap-4 lg:overflow-visible',
        expanded ? 'lg:grid-cols-1' : 'lg:grid-cols-2',
      )}
    >
      <MapPane
        state={state}
        view={view}
        token={token}
        expanded={expanded}
        onToggleExpanded={onToggleExpanded}
      />
      <ListPane
        state={state}
        view={view}
        expanded={expanded}
        layout={layout}
        scrollerRef={refs.scrollerRef}
        listRef={refs.listRef}
      />
      <BackToMap layout={layout} />
    </div>
  )
}

/** Measured sizes the layout's classes read, as CSS custom properties in pixels. */
function useCssSizes(ref: RefObject<HTMLElement | null>, sizes: Record<string, number>) {
  const entries = Object.entries(sizes)
  const key = entries.map(([name, px]) => `${name}:${px}`).join(';')
  useLayoutEffect(() => {
    for (const [name, px] of entries) ref.current?.style.setProperty(name, `${px}px`)
    // `key` stands for `entries`, a new array every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, key])
}

export function ObservationViewer({ centerSlug, settings, initialTab }: ObservationViewerProps) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || null
  const state = useViewerState(settings, initialTab)
  const view = useViewerMap(centerSlug, state, token)
  const barRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(false)
  const headerHeight = useStickyHeaderHeight()
  const layout = useViewerLayout({ barRef, frameRef, scrollerRef, listRef })
  const rootRef = useRef<HTMLDivElement>(null)
  useCssSizes(rootRef, { '--view-bar': layout.barHeight, '--header-bottom': headerHeight })

  return (
    <div
      ref={rootRef}
      // In the phone layout the viewer is exactly the screen under the site's sticky header.
      className="relative flex h-[calc(100dvh-var(--header-bottom))] flex-col lg:block lg:h-auto"
      data-testid="observation-viewer"
    >
      <StickyBar barRef={barRef} scrolledUnder={layout.scrolledUnder} expanded={expanded}>
        <ViewerHeader state={state} view={view} token={token} />
      </StickyBar>
      <ViewerFrame
        state={state}
        view={view}
        token={token}
        layout={layout}
        refs={{ frameRef, scrollerRef, listRef }}
        expanded={expanded}
        onToggleExpanded={() => setExpanded((value) => !value)}
      />
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
