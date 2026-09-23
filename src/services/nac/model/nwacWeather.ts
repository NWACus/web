/**
 * The normalized NWAC weather model. NWAC's in-house weather product, read from
 * products-api; components consume only this.
 *
 * Grids are keyed for lookup — `temp[zoneId][periodKey]` — rather than the flat rows the wire
 * sends, so a table renders by walking its axes instead of searching. Every axis carries its
 * resolved calendar date, so no consumer does service-date arithmetic.
 */

export type NwacWeatherIssuanceType = 'morning' | 'afternoon'

export interface NwacWeatherZone {
  id: string
  name: string
  /** The NAC avalanche zone this weather zone corresponds to, when the names match. */
  avalancheZoneId: number | null
}

export interface NwacWeatherPoint {
  code: string
  name: string
  zoneId: string | null
  zoneName: string
  avalancheZoneId: number | null
}

export interface NwacWeatherPeriod {
  key: string
  label: string
  short: string | null
  kind: 'day' | 'night'
  /** `YYYY-MM-DD` */
  date: string
  /** Whether the issuance forecasts precipitation for this period. */
  precip: boolean
}

export interface NwacWeatherBlock {
  key: string
  label: string
  /** Morning / Afternoon / Evening / Night */
  part: string
  /** The 12h period this 6h block belongs to. */
  period: string | null
}

export interface NwacWeatherExtendedBlock {
  key: string
  label: string
  part: string
  /** `YYYY-MM-DD` */
  date: string
}

export interface NwacWeatherPrecipCell {
  qpf: number | null
  density: number | null
}
export interface NwacWeatherTempCell {
  high: number | null
  low: number | null
}
export interface NwacWeatherWindCell {
  dir: string | null
  speed: number | null
}
export interface NwacWeatherLevelCell {
  freezing: number | null
  drop: number | null
  mode: string | null
}

/** `outer id → slot key → cell` */
export type NwacWeatherGrid<Cell> = Record<string, Record<string, Cell>>

export interface NwacWeatherIssuance {
  id: number
  type: NwacWeatherIssuanceType
  /** ISO instant. */
  issuedAt: string
  /** `YYYY-MM-DD` — Day 1 of the forecast. */
  serviceDate: string
  author: string | null
  /** Forecaster-authored HTML; sanitize before rendering. */
  synopsis: string | null
  extendedOutlook: string | null
  zones: NwacWeatherZone[]
  points: NwacWeatherPoint[]
  periods: NwacWeatherPeriod[]
  blocks: NwacWeatherBlock[]
  extendedBlocks: NwacWeatherExtendedBlock[]
  /** by point code, then period key */
  precip: NwacWeatherGrid<NwacWeatherPrecipCell>
  /** by zone id, then period key */
  temp: NwacWeatherGrid<NwacWeatherTempCell>
  /** by zone id, then block key */
  wind: NwacWeatherGrid<NwacWeatherWindCell>
  snowLevel: NwacWeatherGrid<NwacWeatherLevelCell>
  /** by zone id, then extended block key */
  extendedSnowLevel: NwacWeatherGrid<NwacWeatherLevelCell>
  /** by zone id, then slot (`morning` = Today / Tonight, `afternoon` = Tomorrow) */
  sensible: NwacWeatherGrid<string>
}

/** Every issuance published for one forecast date, newest first. */
export interface NwacWeatherForecastDay {
  serviceDate: string
  issuances: NwacWeatherIssuance[]
}
