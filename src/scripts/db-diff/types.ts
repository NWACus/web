export type ColumnInfo = {
  name: string
  type: string
  notNull: boolean
  defaultValue: string | null
  primaryKey: number
}

export type TableSnapshot = {
  columns: ColumnInfo[]
  rowCount: number
  /** Row id → one value hash per column, in `columns` order. Omitted for volatile tables. */
  rows?: Record<string, string[]>
}

/** Indexes, triggers and views: anything in `sqlite_master` that isn't a table. */
export type SchemaObject = {
  type: string
  name: string
  sql: string | null
}

export type DbSnapshot = {
  takenAt: string
  pendingMigrations: string[]
  tables: Record<string, TableSnapshot>
  schemaObjects: SchemaObject[]
  /** `PRAGMA foreign_key_check` violation counts keyed by "child → parent". */
  foreignKeyViolations: Record<string, number>
}

export type TableDiff = {
  table: string
  rowsBefore: number
  rowsAfter: number
  addedColumns: string[]
  droppedColumns: string[]
  alteredColumns: string[]
  /** False for volatile tables, which only compare counts and leave the row-level fields empty. */
  rowsCompared: boolean
  addedIds: string[]
  deletedIds: string[]
  changedIds: string[]
  /** Column name → number of rows whose value changed in it. */
  changedColumns: Record<string, number>
}

export type DbDiffReport = {
  migrations: string[]
  addedTables: { table: string; rows: number }[]
  droppedTables: { table: string; rows: number }[]
  addedObjects: string[]
  droppedObjects: string[]
  alteredObjects: string[]
  tables: TableDiff[]
  newForeignKeyViolations: string[]
}
