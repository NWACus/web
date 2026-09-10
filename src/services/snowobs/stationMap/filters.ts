/**
 * The station map's filters, as pure functions over the model.
 *
 * Ported from the legacy widget's station and webcam stores: which stations show, which webcams
 * show, and the order the info panel walks them in. Kept free of React so the rules are unit
 * tested and the component only wires them up.
 */
import { boundsOfGeometries, type Bounds } from '@/utilities/geo/bounds'

import type { StationMapStation, StationMapUnits, StationMapWebcam, StationMapZone } from './model'

export const SHOW_ALL_VARIABLE = 'show_all'
/** The widget's "no recency limit" sentinel; large enough that nothing is ever older. */
export const SHOW_ALL_WITHIN = 1e9

export type StationMapType = 'stations' | 'webcams' | null

export interface StationMapFilters {
  /** The variable whose value labels each marker, or `show_all` for plain dots. */
  variable: string
  /** Hide stations whose latest reading is older than this many minutes. */
  withinMinutes: number
  units: StationMapUnits
  /** Only one data source, or null for all. */
  source: string | null
  type: StationMapType
  /** Zone names to keep; empty keeps every zone. */
  zones: string[]
}

export const DEFAULT_FILTERS: StationMapFilters = {
  variable: SHOW_ALL_VARIABLE,
  withinMinutes: SHOW_ALL_WITHIN,
  units: 'default',
  source: null,
  type: null,
  zones: [],
}

export const WITHIN_OPTIONS: { value: number; label: string }[] = [
  { value: SHOW_ALL_WITHIN, label: 'Show All' },
  { value: 60, label: '1 hour' },
  { value: 180, label: '3 hours' },
  { value: 360, label: '6 hours' },
  { value: 720, label: '12 hours' },
  { value: 1440, label: '1 day' },
]

export const UNIT_OPTIONS: { value: StationMapUnits; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'english', label: 'English' },
  { value: 'metric', label: 'Metric' },
]

export const TYPE_OPTIONS: { value: StationMapType; label: string }[] = [
  { value: null, label: 'All Types' },
  { value: 'stations', label: 'Stations' },
  { value: 'webcams', label: 'Webcams' },
]

/** Units are a data setting, not a filter: they change what is fetched, not what is hidden. */
export function isFilterActive(filters: StationMapFilters): boolean {
  return (
    filters.variable !== SHOW_ALL_VARIABLE ||
    filters.withinMinutes !== SHOW_ALL_WITHIN ||
    filters.source !== null ||
    filters.type !== null ||
    filters.zones.length > 0
  )
}

/** Minutes since each station's reading, keyed by stid — computed once per render, not per filter. */
export type StationAges = Map<string, number>

type StationPredicate = (station: StationMapStation) => boolean

/**
 * A station that has never reported shows with everything else, but has no reading "within" any
 * limit a reader sets.
 */
function recentEnough(filters: StationMapFilters, ages: StationAges): StationPredicate {
  if (filters.withinMinutes === SHOW_ALL_WITHIN) return () => true
  return (station) => (ages.get(station.stid) ?? Infinity) <= filters.withinMinutes
}

function fromSource(filters: StationMapFilters): StationPredicate {
  const { source } = filters
  return source ? (station) => station.source === source : () => true
}

function hasLabelReading(filters: StationMapFilters): StationPredicate {
  const { variable } = filters
  if (variable === SHOW_ALL_VARIABLE) return () => true
  return (station) => station.data[variable] != null
}

function inZones(filters: StationMapFilters): StationPredicate {
  const { zones } = filters
  return zones.length === 0 ? () => true : (station) => zones.includes(station.zone)
}

export function filterStations(
  stations: StationMapStation[],
  filters: StationMapFilters,
  ages: StationAges,
): StationMapStation[] {
  if (filters.type === 'webcams') return []

  const predicates = [
    recentEnough(filters, ages),
    fromSource(filters),
    hasLabelReading(filters),
    inZones(filters),
  ]
  return stations.filter((station) => predicates.every((keep) => keep(station)))
}

/** Webcams have no readings, so labelling markers by a variable hides them, as the widget does. */
export function filterWebcams(
  webcams: StationMapWebcam[],
  filters: StationMapFilters,
): StationMapWebcam[] {
  if (filters.type === 'stations') return []
  if (filters.variable !== SHOW_ALL_VARIABLE) return []
  if (filters.zones.length === 0) return webcams
  return webcams.filter((webcam) => filters.zones.includes(webcam.zone))
}

export type MapPoint =
  | { kind: 'station'; id: string; station: StationMapStation }
  | { kind: 'webcam'; id: string; webcam: StationMapWebcam }

export function stationPointId(stid: string): string {
  return `station-${stid}`
}

export function webcamPointId(id: number): string {
  return `webcam-${id}`
}

export function pointCoordinates(point: MapPoint): [number, number] {
  return point.kind === 'station' ? point.station.coordinates : point.webcam.coordinates
}

/**
 * Where a point goes when it is opened: a station's native page, or — for a webcam that is
 * nothing but a link — that link, which the widget opens directly rather than in a card.
 */
export function pointDestination(point: MapPoint): { href: string; external: boolean } | null {
  if (point.kind === 'station') {
    return point.station.href ? { href: point.station.href, external: false } : null
  }
  const [only] = point.webcam.images
  const linkOnly = point.webcam.images.length === 1 && only.type === 'url'
  return linkOnly ? { href: only.source, external: true } : null
}

function zoneOf(point: MapPoint): string {
  return point.kind === 'station' ? point.station.zone : point.webcam.zone
}

/**
 * The order the info panel steps through points in: by zone name, then north-west to south-east
 * within a zone — the widget's `hypot(-lng, lat)` sort, kept so neighbouring stations sit next to
 * each other as a reader pages through.
 */
export function orderedPoints(
  stations: StationMapStation[],
  webcams: StationMapWebcam[],
): MapPoint[] {
  const points: MapPoint[] = [
    ...stations.map(
      (station): MapPoint => ({
        kind: 'station',
        id: stationPointId(station.stid),
        station,
      }),
    ),
    ...webcams.map(
      (webcam): MapPoint => ({ kind: 'webcam', id: webcamPointId(webcam.id), webcam }),
    ),
  ]

  return points.sort((a, b) => {
    const byZone = zoneOf(a).localeCompare(zoneOf(b))
    if (byZone !== 0) return byZone
    const [aLng, aLat] = pointCoordinates(a)
    const [bLng, bLat] = pointCoordinates(b)
    return Math.hypot(-bLng, bLat) - Math.hypot(-aLng, aLat)
  })
}

/** The data sources present in the response, in first-seen order, for the legend. */
export function dataSources(stations: StationMapStation[]): string[] {
  return Array.from(new Set(stations.map((station) => station.source)))
}

/** The box around the zones a reader chose, or null when nothing is chosen to frame. */
export function chosenZoneBounds(zones: StationMapZone[], chosenNames: string[]): Bounds | null {
  if (chosenNames.length === 0) return null
  const chosen = zones.filter((zone) => chosenNames.includes(zone.name))
  return boundsOfGeometries(chosen.map((zone) => zone.geometry))
}
