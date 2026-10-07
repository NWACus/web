import type {
  ColumnInfo,
  DbDiffReport,
  DbSnapshot,
  SchemaObject,
  TableDiff,
  TableSnapshot,
} from './types'

const byId = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true })

function describeColumn(column: ColumnInfo): string {
  const notNull = column.notNull ? ' NOT NULL' : ''
  const defaultValue = column.defaultValue === null ? '' : ` DEFAULT ${column.defaultValue}`
  const primaryKey = column.primaryKey > 0 ? ' PRIMARY KEY' : ''
  return `${column.type}${notNull}${defaultValue}${primaryKey}`
}

function diffColumns(before: ColumnInfo[], after: ColumnInfo[]) {
  const beforeByName = new Map(before.map((column) => [column.name, column]))
  const afterNames = new Set(after.map((column) => column.name))
  const alteredColumns: string[] = []
  for (const column of after) {
    const previous = beforeByName.get(column.name)
    if (previous && describeColumn(previous) !== describeColumn(column)) {
      alteredColumns.push(`${column.name}: ${describeColumn(previous)} → ${describeColumn(column)}`)
    }
  }
  return {
    addedColumns: after.filter((column) => !beforeByName.has(column.name)).map((c) => c.name),
    droppedColumns: before.filter((column) => !afterNames.has(column.name)).map((c) => c.name),
    alteredColumns,
  }
}

/** Index pairs for the columns present in both snapshots, so added or dropped columns don't mark every row as changed. */
function sharedColumnIndexes(before: ColumnInfo[], after: ColumnInfo[]) {
  const afterIndex = new Map(after.map((column, index) => [column.name, index]))
  return before.flatMap((column, beforeIndex) => {
    const index = afterIndex.get(column.name)
    return index === undefined ? [] : [{ name: column.name, beforeIndex, afterIndex: index }]
  })
}

function diffRows(
  before: Required<TableSnapshot>,
  after: Required<TableSnapshot>,
): Pick<TableDiff, 'addedIds' | 'deletedIds' | 'changedIds' | 'changedColumns'> {
  const shared = sharedColumnIndexes(before.columns, after.columns)
  const changedIds: string[] = []
  const changedColumns: Record<string, number> = {}
  for (const [id, beforeHashes] of Object.entries(before.rows)) {
    const afterHashes = after.rows[id]
    const changed = afterHashes
      ? shared.filter((c) => beforeHashes[c.beforeIndex] !== afterHashes[c.afterIndex])
      : []
    if (changed.length > 0) changedIds.push(id)
    for (const { name } of changed) changedColumns[name] = (changedColumns[name] ?? 0) + 1
  }
  return {
    addedIds: Object.keys(after.rows).filter((id) => !(id in before.rows)),
    deletedIds: Object.keys(before.rows).filter((id) => !(id in after.rows)),
    changedIds,
    changedColumns,
  }
}

function hasRows(table: TableSnapshot): table is Required<TableSnapshot> {
  return table.rows !== undefined
}

function emptyRowDiff() {
  return { addedIds: [], deletedIds: [], changedIds: [], changedColumns: {} }
}

function isUnchanged(diff: TableDiff): boolean {
  return (
    diff.rowsBefore === diff.rowsAfter &&
    [diff.addedColumns, diff.droppedColumns, diff.alteredColumns].every((list) => !list.length) &&
    [diff.addedIds, diff.deletedIds, diff.changedIds].every((list) => !list.length)
  )
}

function diffTable(table: string, before: TableSnapshot, after: TableSnapshot): TableDiff {
  const rowsCompared = hasRows(before) && hasRows(after)
  const rows = rowsCompared ? diffRows(before, after) : emptyRowDiff()
  return {
    table,
    rowsCompared,
    rowsBefore: before.rowCount,
    rowsAfter: after.rowCount,
    ...diffColumns(before.columns, after.columns),
    addedIds: rows.addedIds.sort(byId),
    deletedIds: rows.deletedIds.sort(byId),
    changedIds: rows.changedIds.sort(byId),
    changedColumns: rows.changedColumns,
  }
}

function diffSchemaObjects(before: SchemaObject[], after: SchemaObject[]) {
  const label = (object: SchemaObject) => `${object.type} \`${object.name}\``
  const beforeByKey = new Map(before.map((object) => [label(object), object]))
  const afterByKey = new Map(after.map((object) => [label(object), object]))
  return {
    addedObjects: [...afterByKey.keys()].filter((key) => !beforeByKey.has(key)),
    droppedObjects: [...beforeByKey.keys()].filter((key) => !afterByKey.has(key)),
    alteredObjects: [...afterByKey].flatMap(([key, object]) => {
      const previous = beforeByKey.get(key)
      return previous && previous.sql !== object.sql ? [key] : []
    }),
  }
}

function newForeignKeyViolations(before: DbSnapshot, after: DbSnapshot): string[] {
  return Object.entries(after.foreignKeyViolations).flatMap(([key, count]) => {
    const growth = count - (before.foreignKeyViolations[key] ?? 0)
    return growth > 0 ? [`${key} (+${growth})`] : []
  })
}

/** Compares a snapshot taken before migrations with one taken after. */
export function diffSnapshots(before: DbSnapshot, after: DbSnapshot): DbDiffReport {
  const beforeTables = Object.keys(before.tables).sort()
  const afterTables = Object.keys(after.tables).sort()
  return {
    migrations: before.pendingMigrations,
    addedTables: afterTables
      .filter((table) => !(table in before.tables))
      .map((table) => ({ table, rows: after.tables[table].rowCount })),
    droppedTables: beforeTables
      .filter((table) => !(table in after.tables))
      .map((table) => ({ table, rows: before.tables[table].rowCount })),
    ...diffSchemaObjects(before.schemaObjects, after.schemaObjects),
    tables: beforeTables
      .filter((table) => table in after.tables)
      .map((table) => diffTable(table, before.tables[table], after.tables[table]))
      .filter((diff) => !isUnchanged(diff)),
    newForeignKeyViolations: newForeignKeyViolations(before, after),
  }
}
