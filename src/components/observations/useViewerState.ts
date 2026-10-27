'use client'

/**
 * Everything the viewer knows that isn't the map: where it is (tab, open record), what it is
 * filtered to, the place searched for, and the marker or card being hovered — with the filter
 * handlers the toolbar, sheet and tags share.
 */
import { useCallback, useMemo, useState } from 'react'

import type { ObservationKind } from '@/services/nac/model/observation'
import {
  PAGE_SIZE,
  defaultFilters,
  removeTag,
  type FilterTag,
  type ObservationFilters,
} from '@/services/nac/observations/filters'
import type { ObservationViewerSettings } from '@/services/nac/observations/viewerSettings'

import type { ChosenPlace } from './map/placeSearch'
import type { ListStatus } from './useObservationList'
import { useViewerFilters } from './useViewerFilters'
import { useViewerLocation, type OpenRecord } from './useViewerLocation'

/** The list's query string with the dates always explicit, as the list endpoint wants them. */
function withDates(listSearch: string, filters: ObservationFilters): string {
  const params = new URLSearchParams(listSearch)
  params.set('startDate', filters.from)
  params.set('endDate', filters.to)
  return params.toString()
}

export function useViewerState(settings: ObservationViewerSettings, initialTab: ObservationKind) {
  const location = useViewerLocation(initialTab)
  const viewer = useViewerFilters({
    timezone: settings.timezone,
    centerId: settings.centerId,
    recordOpen: location.detail !== null,
    zones: settings.zones,
  })
  const [place, setPlace] = useState<ChosenPlace | null>(null)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const { filters, setFilters, today, setList, tabSearch } = viewer
  const { openTab: pushTab } = location

  const changeFilters = useCallback(
    (patch: Partial<ObservationFilters>) => setFilters({ ...filters, ...patch }),
    [filters, setFilters],
  )
  const chosenZones = useMemo(
    () => settings.zones.filter((zone) => filters.zones.includes(zone.id)),
    [settings.zones, filters.zones],
  )

  /** The tab entered starts on its first page; the filters come along. */
  const openTab = useCallback(
    (kind: ObservationKind) => {
      setList({ page: 1 })
      pushTab(kind, tabSearch)
    },
    [setList, pushTab, tabSearch],
  )

  return {
    ...location,
    ...viewer,
    openTab,
    settings,
    place,
    setPlace,
    highlightedId,
    setHighlightedId,
    changeFilters,
    chosenZones,
    apiSearch: useMemo(() => withDates(viewer.listSearch, filters), [viewer.listSearch, filters]),
    removeFilterTag: (tag: FilterTag) => setFilters(removeTag(filters, tag, today)),
    resetAll: () => setFilters(defaultFilters(today)),
  }
}

export type ViewerState = ReturnType<typeof useViewerState>

function pageNeighbours(data: Extract<ListStatus, { state: 'ready' }>['data'], id: string) {
  const ids = data.items.map((item) => item.id)
  const index = ids.indexOf(id)
  if (index < 0) return null
  return {
    position: (data.page - 1) * PAGE_SIZE + index + 1,
    count: data.total,
    previous: ids[index - 1] ?? null,
    next: ids[index + 1] ?? null,
  }
}

/** Where an open record sits in the page behind it, for the modal's previous / next. */
export function neighboursOf(status: ListStatus, record: OpenRecord | null, tab: ObservationKind) {
  if (!record || record.kind !== tab || status.state !== 'ready') return null
  return pageNeighbours(status.data, record.id)
}

/** What the filter sheet's "View N Results" counts: avalanches on their tab, not reports. */
export function resultCount(kind: ObservationKind, status: ListStatus): number | null {
  if (status.state !== 'ready') return null
  return kind === 'observation' ? status.data.total : (status.data.avalancheCount ?? 0)
}
