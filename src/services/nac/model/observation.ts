/**
 * Normalized model for public observations and avalanche occurrences — what the native observation
 * viewer's list, map and detail pages consume, never the observation API's own shapes.
 *
 * The API's records are submitter-authored and loosely validated, so the model is where the
 * looseness stops: every boolean is a boolean, numbers stored as strings are numbers, a location
 * missing either half is `null`, a hidden observer name is `null` whatever the record carried, and
 * a D-size stored as `"D2"` reads as `"2"`. HTML fields (`summary`, `snowpackSummary`) are still
 * the submitter's raw HTML here; sanitizing is a presentation step, done on the server.
 *
 * Media reuses the forecast `MediaItem` union: it is the same NAC media service behind both, and
 * its catch-all already turns the empty, null and unrecognized items older records carry into
 * `unknown`, which nothing displays.
 */
import type { MediaItem } from './forecast'

export type { MediaItem } from './forecast'

/** The two record types, which have separate lists, tiles and detail routes upstream. */
export type ObservationKind = 'observation' | 'avalanche'

export interface LatLng {
  lat: number
  lng: number
}

/**
 * The zone a record was placed in: the obs API assigns a forecast zone or an observation-only
 * zone by location. Both halves are null for a record outside every zone (the widget's "Other"),
 * and for an avalanche nested in its observation's detail response.
 */
export interface ObservationZoneRef {
  id: string | null
  name: string | null
}

export interface ObservationInstability {
  avalanchesObserved: boolean
  avalanchesTriggered: boolean
  avalanchesCaught: boolean
  cracking: boolean
  /** "isolated" | "specific" | "widespread", as the form offers them. */
  crackingDescription: string | null
  collapsing: boolean
  collapsingDescription: string | null
}

export interface ObservationWeather {
  airTemp: string | null
  cloudCover: string | null
  windLoading: string | null
  rainElevation: string | null
  recentSnowfall: string | null
  snowAvailableForTransport: string | null
}

/** An avalanche problem the observer reported, from the long form. */
export interface ObservedProblem {
  type: string
  depth: string | null
  layer: string | null
  /** `[min, max]` as stored: numbers, or `""` when not observed, or `"unknown"`. */
  size: [string, string]
  comments: string | null
  /** Rose sectors like `"north upper"`. */
  locations: string[]
  sensitivity: string | null
  distribution: string | null
}

/** Human, vehicle and structure counts; an absent count is 0, as the form initializes them. */
export interface AvalancheImpacts {
  humansCaught: number
  humansPartBuriedNonCritical: number
  humansPartBuriedCritical: number
  humansFullyBuried: number
  humansInjured: number
  humansKilled: number
  vehiclesHit: number
  vehiclesFullyBuried: number
  vehiclesDamaged: number
  vehiclesDamageCost: number
  structuresHit: number
  structuresDamaged: number
  structuresDestroyed: number
  structuresDamageCost: number
}

/** Who submitted a record. `name` is null unless the submitter chose to show it. */
export interface ObservationObserver {
  type: string
  name: string | null
  organization: string | null
  organizationUrl: string | null
}

export interface Avalanche {
  kind: 'avalanche'
  id: string
  /** The observation this avalanche was reported with, if any; standalone reports have none. */
  observationId: string | null
  centerId: string | null
  obsSource: string | null
  createdAt: string
  observer: ObservationObserver
  forecasterVerified: boolean
  forecasterEdited: boolean
  forecasterEditedReason: string | null
  /** The parent observation's date. */
  obsDate: string | null
  /** When the avalanche occurred, `yyyy-MM-dd`. */
  date: string | null
  dateKnown: boolean
  /** `HH:mm[:ss][offset]` as stored, or null when not reported. */
  time: string | null
  timeKnown: boolean
  location: LatLng | null
  locationName: string | null
  zone: ObservationZoneRef
  number: number | null
  aspect: string | null
  aspectRange: string[]
  elevation: number | null
  avalancheType: string | null
  avalancheProblem: string | null
  trigger: string | null
  cause: string | null
  bedSurface: string | null
  avgCrownDepth: number | null
  /** Destructive size without any `D` prefix, e.g. `"2.5"`. */
  dSize: string | null
  rSize: string | null
  weakLayerDate: string | null
  weakLayerType: string | null
  width: number | null
  verticalFall: number | null
  slopeAngle: number | null
  terminus: string | null
  media: MediaItem[]
  attachmentUrl: string | null
  attachmentDescription: string | null
  comments: string | null
  impacts: AvalancheImpacts
  impactsComments: string | null
}

export interface Observation {
  kind: 'observation'
  id: string
  centerId: string | null
  obsSource: string | null
  createdAt: string
  observer: ObservationObserver
  /** `yyyy-MM-dd`. */
  startDate: string | null
  endDate: string | null
  /** Hours in the field, in half-hour steps (`7.5` is 7:30), when both ends were given. */
  timeInField: { start: number; end: number } | null
  activity: string[]
  location: LatLng | null
  locationName: string | null
  route: string | null
  zone: ObservationZoneRef
  instability: ObservationInstability
  instabilitySummary: string | null
  /** Submitter HTML or plain text; null when the submitter kept it private. */
  summary: string | null
  media: MediaItem[]
  /** Linked videos and other media, as URLs. */
  urls: string[]
  avalanchesSummary: string | null
  avalanches: Avalanche[]
  weather: ObservationWeather | null
  weatherSummary: string | null
  /** Submitter HTML. */
  snowpackSummary: string | null
  snowpackMedia: MediaItem[]
  problems: ObservedProblem[]
  problemsComments: string | null
}

/** One page of a list, and the totals across every page. */
export interface ObservationPage<T> {
  items: T[]
  /** Matching records across all pages. */
  total: number
  pages: number
  page: number
  /**
   * The avalanche list's headline figure: the sum of `number` across every matching record, so a
   * report of twelve avalanches counts as twelve. Null on the observation list.
   */
  avalancheCount: number | null
}

/** A zone the viewer's zone filter offers, from the API's combined forecast and obs zones. */
export interface ObservationZoneOption {
  id: string
  name: string
  type: 'forecast' | 'observation'
  /** Upstream center ids the zone belongs to; an obs zone can be shared between centers. */
  centerIds: string[]
  /** Forecast zones first, then observation zones (the API's own priority). */
  priority: number
  /** What the map frames when the zone is chosen, `[[west, south], [east, north]]`. */
  bounds: [[number, number], [number, number]] | null
}

// ─── Stats (the charts tab) ─────────────────────────────────────────────────

/** One bar or slice of a breakdown. */
export interface StatCount {
  name: string
  count: number
  /** Whether the slice is wide enough to carry its own label (the API's call). */
  showLabel: boolean
}

/** How the API bucketed the time series for the requested range. */
export type StatsAggregation = 'daily' | 'weekly' | 'monthly'

/** One bucket of a time series; a day's `periodEnd` is its own date. */
export interface StatsBucket<K extends string> {
  date: string
  periodEnd: string
  counts: Record<K, number>
}

export type SizeBand = 'D1' | 'D2' | 'D3' | 'D4-5'
export type InstabilityKind = 'avalanchesObserved' | 'crackingCollapsing' | 'noInstability'

/** The aspect-and-elevation rose: counts per aspect per band, lowest band first. */
export interface AspectElevationRose {
  /** Elevation bands from lowest (index 0) to highest, as the API binned them. */
  bands: { label: string; from: number; to: number }[]
  /** One cell per aspect per band index, in the API's order. */
  cells: { aspect: string; band: number; count: number }[]
}

/** The charts tab's data: every breakdown of the avalanches in the viewport for the filters. */
export interface AvalancheStats {
  totalAvalanches: number
  /** What the first chart groups by: zones, or whole centers when the map is zoomed far out. */
  groupedBy: 'zone' | 'center'
  zones: StatCount[]
  triggers: StatCount[]
  sizes: StatCount[]
  problems: StatCount[]
  aggregation: StatsAggregation
  avalanchesOverTime: StatsBucket<SizeBand>[]
  instabilityOverTime: StatsBucket<InstabilityKind>[]
  rose: AspectElevationRose
}
