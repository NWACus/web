import type { StationTable } from '@/services/snowobs/tableHelpers'
import type { UnitSystem } from '@/services/snowobs/units'
import { elevationIn } from '@/services/snowobs/units'

// Readings arrive in the requested system; only column elevations, always feet, convert.
export function withElevationsIn(table: StationTable, system: UnitSystem): StationTable {
  return {
    ...table,
    columns: table.columns.map((column) => ({
      ...column,
      elevation: column.elevation === null ? null : elevationIn(system, column.elevation),
    })),
  }
}
