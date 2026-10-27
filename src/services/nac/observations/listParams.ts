/**
 * The filter model encoded as obs-API query params — the list and stats half of inventory row
 * O10. `./tileFilter` is the other half; the O10 property test holds
 * the two to the same records, with the API's own semantics as the reference.
 *
 * Param names and the rules for when each is sent are the widget's (`buildObservationParams`,
 * `buildAvalancheFilterParams`), since they are what the API was built against: size bounds only
 * when narrowed from D1–D5, elevation whenever set (0 included), one `field[gt]=0` per impact
 * column (the API ORs them).
 */
import type { ObservationKind } from '../model/observation'
import {
  PAGE_SIZE,
  SIZE_RANGE,
  daysBetween,
  type ListState,
  type ObservationFilters,
} from './filters'
import { CAUSES, IMPACTS, TRIGGER_GROUPS } from './options'

/** `[west, south, east, north]`, as the API's `bbox` takes it. */
export type BBox = [number, number, number, number]

export interface ListRequest {
  kind: ObservationKind
  filters: ObservationFilters
  /** The viewer's map viewport; the forecast page's zone tabs ask by zone alone. */
  bbox?: BBox
  list: ListState
  pageSize?: number
}

function setIn(params: URLSearchParams, key: string, values: readonly string[]) {
  if (values.length > 0) params.set(`${key}[in]`, values.join(','))
}

export function triggerCodes(filters: ObservationFilters): string[] {
  return TRIGGER_GROUPS.filter((group) => filters.triggers.includes(group.label)).flatMap(
    (group) => group.codes,
  )
}

export function causeCodes(filters: ObservationFilters): string[] {
  return CAUSES.filter((cause) => filters.causes.includes(cause.label)).map((cause) => cause.code)
}

export function impactFields(filters: ObservationFilters): string[] {
  return IMPACTS.filter((impact) => filters.impacts.includes(impact.value)).flatMap(
    (impact) => impact.fields,
  )
}

/** The filters both tabs share: who, where, which center. */
function sharedFilterParams(
  params: URLSearchParams,
  filters: ObservationFilters,
  centerId: string,
) {
  if (filters.onlyCenter) params.set('center_id[eq]', centerId.toLowerCase())
  setIn(params, 'observer_type', filters.observers)
  setIn(params, 'zone_id', filters.zones)
}

export function observationFilterParams(
  filters: ObservationFilters,
  centerId: string,
): URLSearchParams {
  const params = new URLSearchParams()
  params.set('start_date[gte]', filters.from)
  params.set('start_date[lte]', filters.to)
  sharedFilterParams(params, filters, centerId)
  if (filters.instability) params.set('has_instability', 'true')
  if (filters.avalanchesObserved) params.set('has_avalanches_observed', 'true')
  return params
}

export function avalancheFilterParams(
  filters: ObservationFilters,
  centerId: string,
): URLSearchParams {
  const params = new URLSearchParams()
  params.set('date[gte]', filters.from)
  params.set('date[lte]', filters.to)
  sharedFilterParams(params, filters, centerId)
  setIn(params, 'trigger', triggerCodes(filters))
  setIn(params, 'cause', causeCodes(filters))
  const [min, max] = filters.size
  if (min > SIZE_RANGE[0]) params.set('d_size[gte]', String(min))
  if (max < SIZE_RANGE[1]) params.set('d_size[lte]', String(max))
  if (filters.elevationMin !== null) params.set('elevation[gte]', String(filters.elevationMin))
  if (filters.elevationMax !== null) params.set('elevation[lte]', String(filters.elevationMax))
  setIn(params, 'aspect', filters.aspects)
  setIn(params, 'avalanche_problem', filters.problems)
  for (const field of impactFields(filters)) params.set(`${field}[gt]`, '0')
  return params
}

/** One page of a tab's list, restricted to the map's viewport when there is one (inventory row O11). */
export function listParams(request: ListRequest, centerId: string): URLSearchParams {
  const { kind, filters, bbox, list, pageSize = PAGE_SIZE } = request
  const params =
    kind === 'observation'
      ? observationFilterParams(filters, centerId)
      : avalancheFilterParams(filters, centerId)
  if (bbox) params.set('bbox', bbox.join(','))
  params.set('page', String(list.page))
  params.set('page_size', String(pageSize))
  const dateColumn = kind === 'observation' ? 'start_date' : 'date'
  params.set('sort_by', list.sortBy === 'createdAt' ? 'created_at' : dateColumn)
  params.set('sort_order', list.sortOrder)
  return params
}

// ─── Stats (the charts tab) ─────────────────────────────────────────────────

/** The stats endpoint refuses a wider range ("Date range cannot exceed 366 days"). */
export const STATS_MAX_DAYS = 366

/**
 * Below this zoom the widget asks for avalanches by center rather than by zone, unless the viewer
 * is already narrowed to its own center.
 */
export const CENTER_AGGREGATION_BELOW_ZOOM = 6

export type StatsAggregation = 'zone' | 'center'

export interface StatsRequest {
  filters: ObservationFilters
  bbox: BBox
  /** The map's zoom, for the by-center rule; null when there is no map. */
  zoom: number | null
}

/** Whether the filters span more days than the stats endpoint will aggregate. */
export function isStatsRange(filters: Pick<ObservationFilters, 'from' | 'to'>): boolean {
  const days = daysBetween(filters.from, filters.to)
  return days >= 0 && days <= STATS_MAX_DAYS
}

/** By zone, or by center when the map is zoomed out past the rule and no center filter is set. */
export function statsAggregation(
  request: Pick<StatsRequest, 'filters' | 'zoom'>,
): StatsAggregation {
  const { filters, zoom } = request
  if (filters.onlyCenter || zoom === null) return 'zone'
  return zoom >= CENTER_AGGREGATION_BELOW_ZOOM ? 'zone' : 'center'
}

/** Every breakdown of the avalanches in the viewport, with the avalanche filters applied. */
export function statsParams(request: StatsRequest, centerId: string): URLSearchParams {
  const params = avalancheFilterParams(request.filters, centerId)
  params.set('bbox', request.bbox.join(','))
  params.set('aggregation_type', statsAggregation(request))
  return params
}
