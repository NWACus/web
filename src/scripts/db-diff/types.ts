export type ColumnInfo = {
  name: string
  type: string
  notNull: boolean
  defaultValue: string | null
  primaryKey: number
}

export type TableSnapshot = {
  columns: ColumnInfo[]
  /** Foreign keys and UNIQUE / PRIMARY KEY constraints, described by content so renames don't count. */
  constraints: string[]
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

/** A table (or the foreign key check) that couldn't be read. */
export type SnapshotError = {
  target: string
  code: string
  message: string
}

export type DbSnapshot = {
  takenAt: string
  pendingMigrations: string[]
  tables: Record<string, TableSnapshot>
  schemaObjects: SchemaObject[]
  /** `PRAGMA foreign_key_check` violation counts keyed by "child → parent"; null when the check failed. */
  foreignKeyViolations: Record<string, number> | null
  errors: SnapshotError[]
}

export type TableDiff = {
  table: string
  rowsBefore: number
  rowsAfter: number
  addedColumns: string[]
  droppedColumns: string[]
  alteredColumns: string[]
  addedConstraints: string[]
  droppedConstraints: string[]
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
  failures: (SnapshotError & { snapshot: 'before' | 'after' })[]
}
