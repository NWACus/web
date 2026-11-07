import { spanningTimezoneLabel } from '@/services/snowobs/constants'
import type { StationTable, StationTables, TableColumn } from '@/services/snowobs/tableHelpers'

// A column only an older chunk reports slots in after the column it follows there, so the order
// matches what one read of the whole range would have shown.
function mergeColumns(shown: TableColumn[], older: TableColumn[]): TableColumn[] {
  const merged = [...shown]
  older.forEach((column, index) => {
    if (merged.some((c) => c.key === column.key)) return
    const previous = older[index - 1]
    merged.splice(merged.findIndex((c) => c.key === previous?.key) + 1, 0, column)
  })
  return merged
}

function mergeTable(shown: StationTable, older: StationTable): StationTable {
  const hours = new Set(shown.rows.map((row) => row.timestamp))
  return {
    ...shown,
    columns: mergeColumns(shown.columns, older.columns),
    rows: [...shown.rows, ...older.rows.filter((row) => !hours.has(row.timestamp))],
    timezoneLabel: spanningTimezoneLabel(shown.timezoneLabel, older.timezoneLabel),
  }
}

/** The rows loaded so far, newest first. Metric drops out if any chunk failed to read it. */
export function mergeTables(shown: StationTables, older: StationTables[]): StationTables {
  return older.reduce(
    (merged, chunk) => ({
      default: mergeTable(merged.default, chunk.default),
      metric: merged.metric && chunk.metric ? mergeTable(merged.metric, chunk.metric) : null,
    }),
    shown,
  )
}
