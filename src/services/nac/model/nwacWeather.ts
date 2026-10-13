/**
 * The NWAC weather model components render. Grids are keyed for lookup (`temp[zoneId][periodKey]`)
 * and every axis carries its calendar date. Which grids the forecast has, its rows, and the slots
 * each grid covers all come from the format it was published under, frozen with it; how each table
 * reads is the page's own.
 */

export type NWACWeatherIssuanceType = 'morning' | 'afternoon'

/** The format the forecast was published under: one center's instance of a template. */
export interface NWACWeatherFormat {
  id: number
  name: string | null
  /** The template's registry name, e.g. `dashboardv2_09-2026`. */
  template: string
  /** ISO instant the format took effect; null when the wire didn't say. */
  startsAt: string | null
}

export interface NWACWeatherZone {
  /** The key the zone grids use; stable across forecasts. */
  id: string
  slug: string | null
  name: string
  /** The NAC avalanche zone this weather zone corresponds to, when the names match. */
  avalancheZoneId: number | null
  /** Whether the format carries the extended snow-level outlook for this zone. */
  extendedSnowLevel: boolean
}

export interface NWACWeatherPoint {
  /** The key the precip grid uses; stable across forecasts. */
  id: string
  code: string
  name: string
  /** The id of the zone the point sits in. */
  zoneId: string | null
  avalancheZoneId: number | null
}

export interface NWACWeatherPeriod {
  key: string
  label: string
  short: string | null
  kind: 'day' | 'night'
  /** `YYYY-MM-DD` */
  date: string
}

export interface NWACWeatherBlock {
  key: string
  label: string
  /** Morning / Afternoon / Evening / Night */
  part: string
  /** The 12h period this 6h block belongs to. */
  period: string | null
}

export interface NWACWeatherExtendedBlock {
  key: string
  label: string
  part: string
  /** `YYYY-MM-DD` */
  date: string
}

export interface NWACWeatherSensibleSlot {
  key: string
  /** "Today", "Tonight", "Tomorrow", as the issuance frames it. */
  label: string
  /** `YYYY-MM-DD`; null when the slot isn't pinned to a period. */
  date: string | null
}

/** The grids a template section can name. */
export type NWACWeatherGridName =
  | 'sensible'
  | 'precip'
  | 'snowLevel'
  | 'temp'
  | 'wind'
  | 'extendedSnowLevel'

/** One section of the forecast's template: a grid it has. */
export interface NWACWeatherSection {
  id: string
  /** A grid this page knows how to draw, or another string from a newer template. */
  grid: NWACWeatherGridName | (string & {})
}

/** The slot keys each grid covers. */
export interface NWACWeatherAxes {
  precipPeriods: string[]
  tempPeriods: string[]
  snowLevelBlocks: string[]
  windBlocks: string[]
  extendedBlocks: string[]
  sensibleSlots: string[]
}

export interface NWACWeatherPrecipCell {
  qpf: number | null
  density: number | null
}
export interface NWACWeatherTempCell {
  high: number | null
  low: number | null
}
export interface NWACWeatherWindCell {
  dir: string | null
  speed: number | null
}
export interface NWACWeatherLevelCell {
  freezing: number | null
  drop: number | null
  mode: string | null
}

/** `outer id → slot key → cell` */
export type NWACWeatherGrid<Cell> = Record<string, Record<string, Cell>>

export interface NWACWeatherIssuance {
  id: number
  type: NWACWeatherIssuanceType
  /** ISO instant. */
  issuedAt: string
  /** `YYYY-MM-DD` — Day 1 of the forecast. */
  serviceDate: string
  author: string | null
  format: NWACWeatherFormat
  /** The grids the format's template has. */
  sections: NWACWeatherSection[]
  /** Forecaster-authored HTML; sanitize before rendering. */
  synopsis: string | null
  extendedOutlook: string | null
  zones: NWACWeatherZone[]
  points: NWACWeatherPoint[]
  /** Ids of the zones that carry the extended snow-level outlook, in zone order. */
  extendedZones: string[]
  periods: NWACWeatherPeriod[]
  blocks: NWACWeatherBlock[]
  extendedBlocks: NWACWeatherExtendedBlock[]
  sensibleSlots: NWACWeatherSensibleSlot[]
  axes: NWACWeatherAxes
  /** by point id, then period key */
  precip: NWACWeatherGrid<NWACWeatherPrecipCell>
  /** by zone id, then period key */
  temp: NWACWeatherGrid<NWACWeatherTempCell>
  /** by zone id, then block key */
  wind: NWACWeatherGrid<NWACWeatherWindCell>
  snowLevel: NWACWeatherGrid<NWACWeatherLevelCell>
  /** by zone id, then extended block key */
  extendedSnowLevel: NWACWeatherGrid<NWACWeatherLevelCell>
  /** by zone id, then slot key (see `sensibleSlots` for what each means) */
  sensible: NWACWeatherGrid<string>
}

/** Every issuance published for one forecast date, newest first. */
export interface NWACWeatherForecastDay {
  serviceDate: string
  issuances: NWACWeatherIssuance[]
}
