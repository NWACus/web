'use client'

/**
 * What happens when a reader acts on a station or webcam: select it, open it, or jump to it from
 * the search — the widget's `stationClickHandler`, `openModal` and `stationSearchClick`.
 */
import type { Map as MapboxMap } from 'mapbox-gl'
import { useRouter } from 'next/navigation'
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
 * Open a point, as the widget's second click did: the station page, or a link-only webcam.
 * Returns whether there was anywhere to go. (The widget's second click on a station without a
 * native page, or on a webcam with images, opened a modal; the card already shows what that
 * modal showed, so here it is a no-op.)
 */
function open(point: MapPoint, push: (href: string) => void): boolean {
  const destination = pointDestination(point)
  if (!destination) return false
  if (destination.external) window.open(destination.href, '_blank', 'noopener')
  else push(destination.href)
  return true
}

export function usePointInteractions({
  map,
  wrapperRef,
  selection: { selectedId, setSelectedId, clear },
  track,
}: PointInteractionsOptions) {
  const router = useRouter()
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
      if (open(point, router.push)) track('Map » Open Station')
    },
    [selectedId, selectPoint, router, track],
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
