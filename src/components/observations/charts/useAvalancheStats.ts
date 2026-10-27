'use client'

/**
 * The charts tab's data: every breakdown of the avalanches in the map's viewport, for the
 * filters, from `/api/<center>/observations/avalanches/stats`. Re-fetched as the list is, whenever
 * the filters or viewport change; the list's sort and page are left off the request, since they
 * don't change the answer and would only split the edge cache.
 */
import type { AvalancheStats } from '@/services/nac/model/observation'
import type { BBox } from '@/services/nac/observations/listParams'
import { AVALANCHES_PATH } from '@/services/nac/observations/routes'

import { bboxParam } from '../useObservationList'
import { useViewportQuery, type QueryStatus } from '../useViewportQuery'

export type StatsStatus = QueryStatus<AvalancheStats>

interface StatsQuery {
  centerSlug: string
  /** The viewer's query string (`writeFilters`), plus explicit dates. */
  search: string
  /** Null while there is no viewport, or while the charts tab isn't showing. */
  bbox: BBox | null
  /** The map's zoom in whole levels, for the by-center rule; null without a map. */
  zoom: number | null
  moving?: boolean
}

const LIST_ONLY_KEYS = ['page', 'sortBy', 'sortOrder']

export function statsUrl({ centerSlug, search, bbox, zoom }: StatsQuery & { bbox: BBox }): string {
  const params = new URLSearchParams(search)
  for (const key of LIST_ONLY_KEYS) params.delete(key)
  params.set('bbox', bboxParam(bbox))
  if (zoom !== null) params.set('zoom', String(zoom))
  return `/api/${centerSlug}${AVALANCHES_PATH}/stats?${params.toString()}`
}

export function useAvalancheStats(query: StatsQuery): StatsStatus {
  const { bbox, moving = false } = query
  return useViewportQuery(bbox ? statsUrl({ ...query, bbox }) : null, moving)
}
