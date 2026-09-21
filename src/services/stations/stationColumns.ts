import { SENSOR_LABELS, TABLE_VARIABLE_ORDER } from '@/services/snowobs/constants'

// The readings a station page's table can show, in table order. A page
// chooses a subset; an empty choice means every reading its stations report.
export const STATION_COLUMNS = TABLE_VARIABLE_ORDER.map((variable) => ({
  value: variable,
  label: SENSOR_LABELS[variable] ? `${SENSOR_LABELS[variable]} (${variable})` : variable,
}))

export type StationColumn = (typeof TABLE_VARIABLE_ORDER)[number]

function isStationColumn(value: unknown): value is StationColumn {
  return typeof value === 'string' && TABLE_VARIABLE_ORDER.some((v) => v === value)
}

// The stored selection, known readings only; empty means derive.
export function toStationColumns(value: unknown): StationColumn[] {
  return Array.isArray(value) ? value.filter(isStationColumn) : []
}
