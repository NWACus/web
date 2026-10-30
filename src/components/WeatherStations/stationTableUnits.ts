import type { StationTable } from '@/services/snowobs/tableHelpers'
import type { StationUnits } from '@/services/snowobs/units'
import { elevationIn } from '@/services/snowobs/units'

export function withElevationsIn(table: StationTable, system: StationUnits): StationTable {
  return {
    ...table,
    columns: table.columns.map((column) => ({
      ...column,
      elevation: column.elevation === null ? null : elevationIn(system, column.elevation),
    })),
  }
}
