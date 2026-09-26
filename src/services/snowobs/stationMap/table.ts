/**
 * The station map's table view, as pure functions over the model.
 *
 * Ported from the legacy widget's `StationTable.vue`: which columns show and what they are called,
 * how rows group under zones and sort within them, and which readings are colored for crossing a
 * threshold. Kept free of React so the rules are unit tested and the component only renders them.
 */
import { timezoneAbbreviation } from '@/services/snowobs/constants'

import { orderVariables } from './format'
import { OTHER_ZONE } from './mappers'

import type { StationMapStation, StationMapVariable } from './model'

export const STATION_COLUMN = 'station'
export const ELEVATION_COLUMN = 'elevation'
export const TIME_COLUMN = 'date_time'

/** The widget's column headers (`variableOrder` in `apps/stations/utils/station.js`). */
const COLUMN_LABELS: Record<string, string> = {
  [STATION_COLUMN]: 'Station',
  [ELEVATION_COLUMN]: 'Elev',
  [TIME_COLUMN]: 'Time',
  air_temp: 'Temp',
  relative_humidity: 'RH',
  dew_point_temperature: 'DewP',
  wind_speed_min: 'Min',
  wind_speed: 'Spd',
  wind_gust: 'Gust',
  wind_direction: 'Dir',
  precip_accum_one_hour: 'Pcp1',
  precip_accum_one_hour_total: 'Pcp1Sum',
  precip_accum: 'PcpAc',
  precip_accum_24hr: '∆Pcp',
  snow_water_equiv: 'SWE',
  snow_water_equiv_24hr: '∆SWE',
  snow_depth_24h: '24Sno',
  snow_depth: 'SnoHt',
  snow_depth_24hr: '∆SnoHt',
  intermittent_snow: 'I/S_Sno',
  pressure: 'Pres',
  equip_temperature: 'EqTemp',
}

/** Every variable the center reports, in the widget's order — the reading columns. */
export function readingColumns(variables: StationMapVariable[]): string[] {
  return orderVariables(variables.map((v) => v.variable))
}

/** Station, elevation and time, then the readings. */
export function tableColumns(variables: StationMapVariable[]): string[] {
  return [STATION_COLUMN, ELEVATION_COLUMN, TIME_COLUMN, ...readingColumns(variables)]
}

/** A column's short header: the widget's name for it, else the widget's initials. */
export function columnLabel(column: string): string {
  return COLUMN_LABELS[column] ?? widgetInitials(column)
}

/**
 * The widget's initials for a variable it has no name for. It spaced out only the first
 * underscore, so `soil_temperature_b` is "ST" and `precip_accum_three_hour` is "PA" — kept, since
 * those are the headers forecasters know; the long name is in the tooltip.
 */
function widgetInitials(variable: string): string {
  // A string pattern replaces only the first `_`; `\b(\w)` then takes each word's first letter.
  const initials = variable.replace('_', ' ').match(/\b(\w)/g)
  return initials ? initials.join('').toUpperCase() : variable
}

/**
 * The time column's unit: the center's zone abbreviation, e.g. `PDT`. Falls back to UTC for a zone
 * Intl rejects, as `formatObservedAt` does.
 */
export function timeZoneLabel(timeZone: string, now: Date): string {
  try {
    return timezoneAbbreviation(now, timeZone)
  } catch {
    return 'UTC'
  }
}

// --- Sorting -------------------------------------------------------------------------------------

export type SortDirection = 'asc' | 'desc'

export interface TableSort {
  column: string
  direction: SortDirection
}

export const DEFAULT_TABLE_SORT: TableSort = { column: ELEVATION_COLUMN, direction: 'asc' }

/** A second click on the sorted column reverses it; a new column starts descending, as the widget's does. */
export function nextSort(current: TableSort, column: string): TableSort {
  if (current.column === column) {
    return { column, direction: current.direction === 'asc' ? 'desc' : 'asc' }
  }
  return { column, direction: 'desc' }
}

function sortValue(station: StationMapStation, column: string): string | number | null {
  if (column === STATION_COLUMN) return station.name
  if (column === ELEVATION_COLUMN) return station.elevation
  if (column === TIME_COLUMN) {
    const at = station.observedAt ? Date.parse(station.observedAt) : NaN
    return Number.isFinite(at) ? at : null
  }
  return station.data[column] ?? null
}

function compareValues(a: string | number, b: string | number): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b))
}

/**
 * Sort `stations` by `sort`. A station without the reading sorts last whichever way the column
 * runs — a deliberate divergence from the widget, whose lodash `orderBy` put the blanks first when
 * descending, so sorting by wind speed led with every station that has no anemometer. Ties keep
 * name order.
 */
export function sortStations(stations: StationMapStation[], sort: TableSort): StationMapStation[] {
  const sign = sort.direction === 'asc' ? 1 : -1
  return [...stations].sort((a, b) => {
    const aValue = sortValue(a, sort.column)
    const bValue = sortValue(b, sort.column)
    if (aValue === null || bValue === null) {
      if (aValue !== bValue) return aValue === null ? 1 : -1
    } else {
      const byValue = compareValues(aValue, bValue) * sign
      if (byValue !== 0) return byValue
    }
    return a.name.localeCompare(b.name)
  })
}

// --- Grouping ------------------------------------------------------------------------------------

export interface TableGroup {
  zone: string
  stations: StationMapStation[]
}

/**
 * The table's rows: one group per zone that has stations, each sorted on its own.
 *
 * Groups follow the zone filter's order, as #1346 asked — a deliberate divergence from the widget,
 * whose table walked the map layer's feature order while its filter walked the center's list, so
 * the two could disagree. The widget always ended with `Other`; the model's list only carries it
 * for alternate zones, so it — and any zone the list doesn't name — is added at the end rather
 * than dropping a station from the table.
 */
export function groupStations(
  stations: StationMapStation[],
  zoneNames: string[],
  sort: TableSort,
): TableGroup[] {
  const order = Array.from(
    new Set([...zoneNames, OTHER_ZONE, ...stations.map((station) => station.zone)]),
  )
  return order.flatMap((zone) => {
    const inZone = stations.filter((station) => station.zone === zone)
    return inZone.length > 0 ? [{ zone, stations: sortStations(inZone, sort) }] : []
  })
}

// --- Thresholds ----------------------------------------------------------------------------------

export type ThresholdLevel = 'yellow' | 'orange' | 'red'

interface ThresholdRule {
  /** The SnowObs unit the thresholds are written in; a reading in any other unit isn't colored. */
  unit: string
  /** Ascending, one per level: the highest one a reading is above sets its level. */
  above: number[]
  levels: ThresholdLevel[]
}

/** The widget's `colorRulesEnglish`. */
const THRESHOLD_RULES: Record<string, ThresholdRule> = {
  air_temp: { unit: 'fahrenheit', above: [32], levels: ['orange'] },
  wind_speed: { unit: 'mph', above: [10, 20, 40], levels: ['yellow', 'orange', 'red'] },
  snow_depth_24hr: { unit: 'inches', above: [6, 12, 18], levels: ['yellow', 'orange', 'red'] },
  snow_water_equiv_24hr: {
    unit: 'inches',
    above: [1, 1.5, 2],
    levels: ['yellow', 'orange', 'red'],
  },
}

export interface ThresholdCrossing {
  level: ThresholdLevel
  /** The threshold the reading is above, in the reading's own unit. */
  above: number
}

/**
 * The highest of the widget's thresholds a reading crosses, or null.
 *
 * The thresholds are English-unit numbers, and the widget withheld them only when the reader chose
 * metric — so a center whose default units are metric had its millimeters colored as inches. Here
 * a rule applies only when the variable's unit is the one it was written in.
 */
export function thresholdCrossing(
  variable: string,
  value: number | null | undefined,
  rawUnit: string | undefined,
): ThresholdCrossing | null {
  const rule = THRESHOLD_RULES[variable]
  if (!rule || value == null || rawUnit !== rule.unit) return null
  const crossed = rule.above.filter((threshold) => value > threshold).length
  if (crossed === 0) return null
  return { level: rule.levels[crossed - 1], above: rule.above[crossed - 1] }
}

/** Whether any column shown could be colored — what decides if Settings offers the switch. */
export function hasThresholdColumns(columns: string[], units: Record<string, string>): boolean {
  return columns.some((column) => units[column] === THRESHOLD_RULES[column]?.unit)
}
