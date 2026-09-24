/**
 * The station map's state in the URL, so a reader can bookmark or link exactly what they are
 * looking at.
 *
 * Everything that describes the view lives here: the filters, the viewport, and whether the map or
 * the table is showing. The one thing that
 * doesn't is units — a preference about the reader rather than about the view — which stays in
 * `./stationMapPrefs`. This is a deliberate divergence from the legacy widget, which cached all of
 * it in browser storage where nothing could be shared and a stale value could outlive its reason.
 *
 * Defaults are omitted rather than written, so a map nobody has touched has a clean URL, and the
 * viewport only appears once a reader has moved the map themselves.
 */
import {
  DEFAULT_FILTERS,
  TYPE_OPTIONS,
  WITHIN_OPTIONS,
  type StationMapFilters,
  type StationMapType,
} from '@/services/snowobs/stationMap/filters'

import type { MapView } from './useStationMap'

const ZONE_PARAM = 'zone'
const VARIABLE_PARAM = 'variable'
const WITHIN_PARAM = 'within'
const SOURCE_PARAM = 'source'
const TYPE_PARAM = 'type'
/** `lat,lng,zoom` in one param, so a shared link reads as a place rather than three numbers. */
const VIEW_PARAM = 'at'
/** `table` for the table view; absent for the map. */
const DISPLAY_PARAM = 'view'
const TABLE_DISPLAY = 'table'

export type StationMapDisplay = 'map' | 'table'

const FILTER_PARAMS = [ZONE_PARAM, VARIABLE_PARAM, WITHIN_PARAM, SOURCE_PARAM, TYPE_PARAM]

// --- Reading ---------------------------------------------------------------------------------

/** Only a recency the filter offers: anything else would select no radio and chip as a number. */
function offeredWithin(raw: string | null): number | undefined {
  const within = Number(raw)
  if (raw === null || !Number.isFinite(within)) return undefined
  return WITHIN_OPTIONS.some((option) => option.value === within) ? within : undefined
}

/** Only a type the filter offers; anything else is "all types". */
function offeredType(raw: string | null): StationMapType {
  return TYPE_OPTIONS.find((option) => option.value !== null && option.value === raw)?.value ?? null
}

/**
 * The filters a URL asks for, over the defaults. `units` is passed in because it comes from the
 * reader's saved preference, not from the link.
 */
export function readFilterParams(
  search: string,
  units: StationMapFilters['units'],
): StationMapFilters {
  const params = new URLSearchParams(search)
  return {
    variable: params.get(VARIABLE_PARAM) ?? DEFAULT_FILTERS.variable,
    withinMinutes: offeredWithin(params.get(WITHIN_PARAM)) ?? DEFAULT_FILTERS.withinMinutes,
    units,
    source: params.get(SOURCE_PARAM),
    type: offeredType(params.get(TYPE_PARAM)),
    zones: params.getAll(ZONE_PARAM).filter((zone) => zone.length > 0),
  }
}

/** The viewport a link pinned, or null for "frame this center for whatever screen this is". */
export function readViewParam(search: string): MapView | null {
  const raw = new URLSearchParams(search).get(VIEW_PARAM)
  if (!raw) return null

  // `lat,lng,zoom`, as `formatView` writes it. A hand-edited value must not fly the map off-globe.
  const parts = raw.split(',').map(Number)
  if (parts.length !== 3 || !parts.every(Number.isFinite)) return null
  const [lat, lng, zoom] = parts
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null

  return { center: { lat, lng }, zoom }
}

export interface DisplayRequest {
  display: StationMapDisplay
  /** A station to pick out in the table, from a legacy `#/station-table/:stid` link. */
  highlight: string | null
  /** The request came from the widget's hash route, which the URL should now drop. */
  legacy: boolean
}

// The widget's hash routes `#/station-table` and `#/station-table/:stid`, optionally followed by
// the query its router carried inside the hash.
const LEGACY_TABLE_HASH = /^#\/station-table(?:\/([^/?]+))?\/?(?:\?.*)?$/

/**
 * Map or table, from the link — including the widget's hash routes to its table, which old
 * bookmarks and forecasters' links still carry.
 */
export function readDisplayRequest(search: string, hash: string): DisplayRequest {
  const legacy = LEGACY_TABLE_HASH.exec(hash)
  if (legacy) {
    return { display: 'table', highlight: legacy[1] ? decodeStid(legacy[1]) : null, legacy: true }
  }
  const display = new URLSearchParams(search).get(DISPLAY_PARAM) === TABLE_DISPLAY ? 'table' : 'map'
  return { display, highlight: null, legacy: false }
}

function isZoneName(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

/**
 * The zones a widget link filtered to. Its router carried the query inside the hash, as JSON —
 * `#/station-table?zone=["Olympics"]` — and forecasters' links still do.
 */
export function readLegacyHashZones(hash: string): string[] {
  const query = hash.startsWith('#/') ? hash.split('?')[1] : undefined
  const raw = query ? new URLSearchParams(query).get(ZONE_PARAM) : null
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isZoneName) : []
  } catch {
    return []
  }
}

/** A malformed escape in a hand-edited link is a stid that matches nothing, not a crash. */
function decodeStid(raw: string): string {
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

// --- Writing ---------------------------------------------------------------------------------

/** Trimmed to what a map view needs: ~11m of latitude, and a hundredth of a zoom level. */
function formatView({ center, zoom }: MapView): string {
  return `${center.lat.toFixed(4)},${center.lng.toFixed(4)},${zoom.toFixed(2)}`
}

function updatedUrl(update: (params: URLSearchParams) => void): string {
  const { pathname, search } = window.location
  const params = new URLSearchParams(search)
  update(params)
  const query = params.toString()
  return `${pathname}${query ? `?${query}` : ''}`
}

/**
 * Rewrite the params this module owns, leaving any other param alone. The hash is dropped: the
 * only one the page reads is a legacy widget link, and once read, the params say the same thing.
 *
 * `replaceState` rather than `pushState`: panning a map is not a navigation, and a back button
 * that walked a reader through every viewport they passed through would be useless.
 */
function replaceParams(update: (params: URLSearchParams) => void): void {
  window.history.replaceState(null, '', updatedUrl(update))
}

function setDisplay(params: URLSearchParams, display: StationMapDisplay): void {
  if (display === 'table') params.set(DISPLAY_PARAM, TABLE_DISPLAY)
  else params.delete(DISPLAY_PARAM)
}

export function writeFilterParams(filters: StationMapFilters): void {
  replaceParams((params) => {
    for (const key of FILTER_PARAMS) params.delete(key)

    if (filters.variable !== DEFAULT_FILTERS.variable) {
      params.set(VARIABLE_PARAM, filters.variable)
    }
    if (filters.withinMinutes !== DEFAULT_FILTERS.withinMinutes) {
      params.set(WITHIN_PARAM, String(filters.withinMinutes))
    }
    if (filters.source) params.set(SOURCE_PARAM, filters.source)
    if (filters.type) params.set(TYPE_PARAM, filters.type)
    for (const zone of filters.zones) params.append(ZONE_PARAM, zone)
  })
}

export function writeViewParam(view: MapView): void {
  replaceParams((params) => params.set(VIEW_PARAM, formatView(view)))
}

/** Stop pinning a viewport — the reset control, handing the framing back to the map. */
export function dropViewParam(): void {
  replaceParams((params) => params.delete(VIEW_PARAM))
}

/** Say which view a legacy link opened, in place of its hash. */
export function writeDisplayParam(display: StationMapDisplay): void {
  replaceParams((params) => setDisplay(params, display))
}

/**
 * Switching between the map and the table is a navigation, as it was in the widget (a router
 * link): Back from the table returns to the map.
 */
export function pushDisplayParam(display: StationMapDisplay): void {
  window.history.pushState(
    null,
    '',
    updatedUrl((params) => setDisplay(params, display)),
  )
}
