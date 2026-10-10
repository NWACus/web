import type {
  ColumnInfo,
  DbDiffReport,
  DbSnapshot,
  SchemaObject,
  SnapshotError,
  TableDiff,
  TableSnapshot,
} from './types'

type RowDiff = Pick<TableDiff, 'addedIds' | 'deletedIds' | 'changedIds' | 'changedColumns'>
type SharedColumn = { name: string; beforeIndex: number; afterIndex: number }

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

function diffConstraints(before: string[], after: string[]) {
  return {
    addedConstraints: after.filter((constraint) => !before.includes(constraint)),
    droppedConstraints: before.filter((constraint) => !after.includes(constraint)),
  }
}

/** Index pairs for the columns present in both snapshots, so added or dropped columns don't mark every row as changed. */
function sharedColumnIndexes(before: ColumnInfo[], after: ColumnInfo[]): SharedColumn[] {
  const afterIndex = new Map(after.map((column, index) => [column.name, index]))
  return before.flatMap((column, beforeIndex) => {
    const index = afterIndex.get(column.name)
    return index === undefined ? [] : [{ name: column.name, beforeIndex, afterIndex: index }]
  })
}

/**
 * Payload deletes and re-inserts `_rels`, `_texts`, `_locales` and version-block rows with fresh
 * integer ids on every update, so these tables are matched by content rather than by id.
 */
export function isReinsertedOnUpdate(columns: ColumnInfo[]): boolean {
  const id = columns.find((column) => column.name === 'id')
  const hasParent = columns.some((column) => ['parent_id', '_parent_id'].includes(column.name))
  return hasParent && id?.type.toLowerCase() === 'integer'
}

function diffRowsById(
  before: Required<TableSnapshot>,
  after: Required<TableSnapshot>,
  shared: SharedColumn[],
): RowDiff {
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

/** A changed row shows up as one deleted and one added row. */
function diffRowsByContent(
  before: Required<TableSnapshot>,
  after: Required<TableSnapshot>,
  shared: SharedColumn[],
): RowDiff {
  const content = shared.filter((column) => column.name !== 'id')
  const unmatched = new Map<string, string[]>()
  for (const [id, hashes] of Object.entries(after.rows)) {
    const key = content.map((c) => hashes[c.afterIndex]).join()
    unmatched.set(key, [...(unmatched.get(key) ?? []), id])
  }
  const deletedIds: string[] = []
  for (const [id, hashes] of Object.entries(before.rows)) {
    const matches = unmatched.get(content.map((c) => hashes[c.beforeIndex]).join())
    if (!matches?.pop()) deletedIds.push(id)
  }
  return {
    addedIds: [...unmatched.values()].flat(),
    deletedIds,
    changedIds: [],
    changedColumns: {},
  }
}

function diffRows(before: Required<TableSnapshot>, after: Required<TableSnapshot>): RowDiff {
  const shared = sharedColumnIndexes(before.columns, after.columns)
  return isReinsertedOnUpdate(before.columns)
    ? diffRowsByContent(before, after, shared)
    : diffRowsById(before, after, shared)
}

function hasRows(table: TableSnapshot): table is Required<TableSnapshot> {
  return table.rows !== undefined
}

function emptyRowDiff(): RowDiff {
  return { addedIds: [], deletedIds: [], changedIds: [], changedColumns: {} }
}

function isUnchanged(diff: TableDiff): boolean {
  const lists = [
    diff.addedColumns,
    diff.droppedColumns,
    diff.alteredColumns,
    diff.addedConstraints,
    diff.droppedConstraints,
    diff.addedIds,
    diff.deletedIds,
    diff.changedIds,
  ]
  return diff.rowsBefore === diff.rowsAfter && lists.every((list) => !list.length)
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
    ...diffConstraints(before.constraints, after.constraints),
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
  const beforeCounts = before.foreignKeyViolations
  if (!beforeCounts || !after.foreignKeyViolations) return []
  return Object.entries(after.foreignKeyViolations).flatMap(([key, count]) => {
    const growth = count - (beforeCounts[key] ?? 0)
    return growth > 0 ? [`${key} (+${growth})`] : []
  })
}

/** Tables that couldn't be read in either snapshot are reported as failures instead of being compared. */
function readableTables(before: DbSnapshot, after: DbSnapshot) {
  const failed = new Set([...before.errors, ...after.errors].map((error) => error.target))
  const readable = (snapshot: DbSnapshot) =>
    Object.keys(snapshot.tables)
      .filter((table) => !failed.has(table))
      .sort()
  return { beforeTables: readable(before), afterTables: readable(after) }
}

const failedIn = (snapshot: 'before' | 'after') => (error: SnapshotError) => ({
  ...error,
  snapshot,
})

/** Compares a snapshot taken before migrations with one taken after. */
export function diffSnapshots(before: DbSnapshot, after: DbSnapshot): DbDiffReport {
  const { beforeTables, afterTables } = readableTables(before, after)
  return {
    migrations: before.pendingMigrations,
    addedTables: afterTables
      .filter((table) => !beforeTables.includes(table))
      .map((table) => ({ table, rows: after.tables[table].rowCount })),
    droppedTables: beforeTables
      .filter((table) => !afterTables.includes(table))
      .map((table) => ({ table, rows: before.tables[table].rowCount })),
    ...diffSchemaObjects(before.schemaObjects, after.schemaObjects),
    tables: beforeTables
      .filter((table) => afterTables.includes(table))
      .map((table) => diffTable(table, before.tables[table], after.tables[table]))
      .filter((diff) => !isUnchanged(diff)),
    newForeignKeyViolations: newForeignKeyViolations(before, after),
    failures: [...before.errors.map(failedIn('before')), ...after.errors.map(failedIn('after'))],
  }
}
