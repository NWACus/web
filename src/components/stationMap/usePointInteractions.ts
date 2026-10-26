'use client'

/**
 * What happens when a reader acts on a station or webcam: select it, open it, or jump to it from
 * the search — the widget's `stationClickHandler`, `openModal` and `stationSearchClick`.
 */
import type { Map as MapboxMap } from 'mapbox-gl'
import type { RefObject } from 'react'
import { useCallback } from 'react'

import { mapboxZoomFor } from '@/services/nac/dangerMap/dangerMapSettings'
import {
  pointCoordinates,
  pointDestination,
  type MapPoint,
} from '@/services/snowobs/stationMap/filters'
import { useAnalytics } from '@/utilities/useAnalytics'

import { useMapBackgroundClick } from './useStationMap'

/** The widget's zoom after a search hit (Google's 11), on Mapbox's tile scale. */
const SEARCH_ZOOM = mapboxZoomFor(11)
/** The widget's info window sits below the map on phones; bring it into view when it opens. */
const SCROLL_INTO_VIEW_MAX_WIDTH = 768

/** Report an interaction to PostHog (inventory row X4), named as the widget named its GA events. */
export function useTrack(): (name: string) => void {
  const { captureWithTenant } = useAnalytics()
  return useCallback(
    (name: string) => captureWithTenant('station_map_interaction', { name }),
    [captureWithTenant],
  )
}

interface Selection {
  selectedId: string | null
  setSelectedId: (id: string | null) => void
  clear: () => void
}

interface PointInteractionsOptions {
  map: MapboxMap | null
  wrapperRef: RefObject<HTMLDivElement | null>
  selection: Selection
  track: (name: string) => void
}

/**
 * Open a point, as the widget's second click did: the station's page, or a link-only webcam.
 * In a new tab, like the card's buttons, so the map and its selection stay put. Returns whether
 * there was anywhere to go; a webcam with images has its card already.
 */
function open(point: MapPoint): boolean {
  const destination = pointDestination(point)
  if (!destination) return false
  window.open(destination, '_blank', 'noopener')
  return true
}

export function usePointInteractions({
  map,
  wrapperRef,
  selection: { selectedId, setSelectedId, clear },
  track,
}: PointInteractionsOptions) {
  useMapBackgroundClick(map, clear)

  const selectPoint = useCallback(
    (point: MapPoint) => {
      setSelectedId(point.id)
      track('Map » Show InfoWindow')
      if (window.innerWidth < SCROLL_INTO_VIEW_MAX_WIDTH) {
        wrapperRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
      }
    },
    [setSelectedId, track, wrapperRef],
  )

  /** First click selects; a second click on the selected marker opens it, as the widget does. */
  const clickPoint = useCallback(
    (point: MapPoint) => {
      if (point.id !== selectedId) {
        selectPoint(point)
        return
      }
      if (open(point)) track('Map » Open Station')
    },
    [selectedId, selectPoint, track],
  )

  const searchSelect = useCallback(
    (point: MapPoint) => {
      selectPoint(point)
      map?.flyTo({ center: pointCoordinates(point), zoom: SEARCH_ZOOM })
      track('Filters » Station Search Click')
    },
    [map, selectPoint, track],
  )

  return { clickPoint, searchSelect }
}
