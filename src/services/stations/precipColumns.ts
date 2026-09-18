import { PRECIP_ACCUMULATION_WINDOWS } from '@/services/snowobs/tableHelpers'

// Every column of the Accumulated Precipitation table other than the station
// name, which is always shown. A center chooses which of these to show.
export const PRECIP_COLUMNS = [
  ...PRECIP_ACCUMULATION_WINDOWS.map((hours) => ({
    value: `${hours}h`,
    label: `${hours}H total`,
  })),
  { value: 'lastUpdate', label: 'Last update' },
  { value: 'latitude', label: 'Latitude' },
  { value: 'longitude', label: 'Longitude' },
  { value: 'elevation', label: 'Elevation' },
] as const

export type PrecipColumn = (typeof PRECIP_COLUMNS)[number]['value']

export const ALL_PRECIP_COLUMNS: PrecipColumn[] = PRECIP_COLUMNS.map((c) => c.value)

function isPrecipColumn(value: unknown): value is PrecipColumn {
  return typeof value === 'string' && ALL_PRECIP_COLUMNS.some((c) => c === value)
}

// The stored selection, or every column when nothing has been chosen: a table
// with only the station name is never what an empty setting means.
export function toPrecipColumns(value: unknown): PrecipColumn[] {
  const chosen = Array.isArray(value) ? value.filter(isPrecipColumn) : []
  return chosen.length > 0 ? chosen : ALL_PRECIP_COLUMNS
}
