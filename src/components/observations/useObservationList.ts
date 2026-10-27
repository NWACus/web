'use client'

/**
 * One page of the showing tab's list, for the map's viewport (inventory row O11), fetched from
 * `/api/<center>/observations/…/list` whenever the tab, filters, sort, page or viewport change.
 * The debounce, abort and wait-for-the-map rules are `useViewportQuery`'s.
 */
import type { ObservationKind } from '@/services/nac/model/observation'
import type { ObservationListResponse } from '@/services/nac/observations/cards'
import type { BBox } from '@/services/nac/observations/listParams'
import { tabPath } from '@/services/nac/observations/routes'

import { useViewportQuery, type QueryStatus } from './useViewportQuery'

export type ListStatus = QueryStatus<ObservationListResponse>

interface ListQuery {
  centerSlug: string
  kind: ObservationKind
  /** The viewer's query string (`writeFilters`), plus explicit dates. */
  search: string
  bbox: BBox | null
  /** The map is on its way somewhere else; its viewport is about to change. */
  moving?: boolean
}

/** The viewport as the API reads it: five decimals is about a metre, and a stable cache key. */
export function bboxParam(bbox: BBox): string {
  return bbox.map((value) => value.toFixed(5)).join(',')
}

function listUrl({ centerSlug, kind, search, bbox }: ListQuery & { bbox: BBox }): string {
  const params = new URLSearchParams(search)
  params.set('bbox', bboxParam(bbox))
  return `/api/${centerSlug}${tabPath(kind)}/list?${params.toString()}`
}

export function useObservationList(query: ListQuery): ListStatus {
  const { bbox, moving = false } = query
  return useViewportQuery(bbox ? listUrl({ ...query, bbox }) : null, moving)
}
