import { LibsqlError, type Client, type ResultSet, type Row, type Value } from '@libsql/client'
import { createHash } from 'crypto'
import fs from 'fs'
import type { ColumnInfo, DbSnapshot, SchemaObject, SnapshotError, TableSnapshot } from './types'

type Executor = Pick<Client, 'execute'>

/**
 * Written to by people using the dev site rather than by migrations, so only row counts are compared.
 * Keep `users_sessions` here: its ids are session secrets and must never reach a report.
 */
const VOLATILE_TABLES = new Set([
  'payload_kv',
  'payload_locked_documents',
  'payload_locked_documents_rels',
  'payload_preferences',
  'payload_preferences_rels',
  'users_sessions',
])

const DEFAULT_PAGE_SIZE = 500
const CONCURRENCY = 4

// Doubles embedded double quotes so any table name is a valid SQL identifier.
const quote = (identifier: string) => `"${identifier.replaceAll('"', '""')}"`

const asString = (value: Value) => (value === null ? '' : String(value))

// The type tag keeps NULL, '' and 0 distinct; bigint and number share one so intMode doesn't matter.
function serialize(value: Value): string {
  if (value === null) return 'null'
  if (value instanceof ArrayBuffer) return `b:${Buffer.from(value).toString('hex')}`
  return typeof value === 'string' ? `s:${value}` : `n:${String(value)}`
}

/** Snapshots hold only hashes, so they carry no prod data. */
export function hashValue(value: Value): string {
  return createHash('sha1').update(serialize(value)).digest('hex').slice(0, 16)
}

export function toSnapshotError(target: string, error: unknown): SnapshotError {
  if (error instanceof LibsqlError) return { target, code: error.code, message: error.message }
  if (error instanceof Error) return { target, code: error.name, message: error.message }
  return { target, code: 'Error', message: String(error) }
}

async function readSchema(client: Executor) {
  // Skips SQLite and libSQL internals, e.g. sqlite_sequence and libsql_wasm_func_table.
  const result = await client.execute(
    "SELECT type, name, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite\\_%' ESCAPE '\\' AND name NOT LIKE 'libsql\\_%' ESCAPE '\\' AND name NOT LIKE '\\_litestream%' ESCAPE '\\' ORDER BY name",
  )
  const objects: SchemaObject[] = result.rows.map((row) => ({
    type: asString(row.type),
    name: asString(row.name),
    sql: row.sql === null ? null : asString(row.sql),
  }))
  return {
    tableNames: objects.filter((object) => object.type === 'table').map((object) => object.name),
    schemaObjects: objects.filter((object) => object.type !== 'table'),
  }
}

/** Runs a pragma table-valued function across every table in one round trip, grouped by table. */
async function perTable(
  client: Executor,
  select: string,
  from: string,
  where = '',
): Promise<Map<string, Row[]>> {
  const result = await client.execute(
    `SELECT m.name AS table_name, ${select} FROM sqlite_master m, ${from} WHERE m.type = 'table' ${where}`,
  )
  const byTable = new Map<string, Row[]>()
  for (const row of result.rows) {
    const table = asString(row.table_name)
    byTable.set(table, [...(byTable.get(table) ?? []), row])
  }
  return byTable
}

function toColumn(row: Row): ColumnInfo {
  return {
    name: asString(row.name),
    type: asString(row.type),
    notNull: Number(row.notnull) === 1,
    defaultValue: row.dflt_value === null ? null : asString(row.dflt_value),
    primaryKey: Number(row.pk),
  }
}

function describeForeignKey(row: Row): string {
  return `FOREIGN KEY (${asString(row.from)}) → ${asString(row.table)}(${asString(row.to)}) ON UPDATE ${asString(row.on_update)} ON DELETE ${asString(row.on_delete)}`
}

/** UNIQUE and non-rowid PRIMARY KEY constraints; named indexes are compared through sqlite_master. */
function describeKeyConstraints(rows: Row[]): string[] {
  const columnsByIndex = new Map<string, string[]>()
  for (const row of rows) {
    const kind = asString(row.origin) === 'pk' ? 'PRIMARY KEY' : 'UNIQUE'
    const key = `${kind}|${asString(row.index_name)}`
    columnsByIndex.set(key, [...(columnsByIndex.get(key) ?? []), asString(row.column_name)])
  }
  return [...columnsByIndex].map(([key, columns]) => `${key.split('|')[0]} (${columns.join(', ')})`)
}

async function readTableShapes(client: Executor) {
  const [columns, foreignKeys, keys] = await Promise.all([
    perTable(client, 'p.*', 'pragma_table_info(m.name) p'),
    perTable(client, 'f.*', 'pragma_foreign_key_list(m.name) f'),
    perTable(
      client,
      'il.name AS index_name, il.origin, ii.name AS column_name',
      'pragma_index_list(m.name) il, pragma_index_info(il.name) ii',
      "AND il.origin != 'c' ORDER BY ii.seqno",
    ),
  ])
  return (table: string) => ({
    columns: (columns.get(table) ?? []).map(toColumn),
    constraints: [
      ...(foreignKeys.get(table) ?? []).map(describeForeignKey),
      ...describeKeyConstraints(keys.get(table) ?? []),
    ].sort(),
  })
}

async function readRowCount(client: Executor, table: string): Promise<number> {
  const result = await client.execute(`SELECT count(*) AS count FROM ${quote(table)}`)
  return Number(result.rows[0].count)
}

function isResponseTooLarge(error: unknown): boolean {
  return error instanceof LibsqlError && error.code === 'RESPONSE_TOO_LARGE'
}

/** Halves the page until the server's response size limit is satisfied, and returns the size that worked. */
async function readPage(client: Executor, sql: string, after: Value, pageSize: number) {
  try {
    return { page: await client.execute({ sql, args: [after, pageSize] }), pageSize }
  } catch (error) {
    if (!isResponseTooLarge(error) || pageSize === 1) throw error
    return readPage(client, sql, after, Math.ceil(pageSize / 2))
  }
}

/** Column 0 of each result row is the rowid; the table's columns follow. */
function addRowHashes(page: ResultSet, keyIndex: number, rows: Record<string, string[]>) {
  for (const row of page.rows) {
    const values = page.columns.slice(1).map((_, index) => row[index + 1])
    rows[asString(row[keyIndex])] = values.map(hashValue)
  }
}

/** Pages by rowid so large tables never come back in one response; rows are keyed by `id`. */
async function readRowHashes(
  client: Executor,
  table: string,
  columns: ColumnInfo[],
  pageSize: number,
) {
  const names = columns.map((column) => column.name)
  const keyIndex = names.indexOf('id') + 1
  const sql = `SELECT rowid, ${names.map(quote).join(', ')} FROM ${quote(table)} WHERE rowid > ? ORDER BY rowid LIMIT ?`
  const rows: Record<string, string[]> = {}
  let after: Value = -1
  let size = pageSize
  for (;;) {
    const result = await readPage(client, sql, after, size)
    addRowHashes(result.page, keyIndex, rows)
    if (result.page.rows.length < result.pageSize) return rows
    size = result.pageSize
    after = result.page.rows[result.page.rows.length - 1][0]
  }
}

async function readTable(
  client: Executor,
  table: string,
  shape: Pick<TableSnapshot, 'columns' | 'constraints'>,
  pageSize: number,
): Promise<TableSnapshot> {
  if (VOLATILE_TABLES.has(table)) {
    return { ...shape, rowCount: await readRowCount(client, table) }
  }
  const rows = await readRowHashes(client, table, shape.columns, pageSize)
  return { ...shape, rowCount: Object.keys(rows).length, rows }
}

async function readForeignKeyViolations(client: Executor): Promise<Record<string, number>> {
  const result = await client.execute('PRAGMA foreign_key_check')
  const counts: Record<string, number> = {}
  for (const row of result.rows) {
    const key = `${asString(row.table)} → ${asString(row.parent)}`
    counts[key] = (counts[key] ?? 0) + 1
  }
  return counts
}

/** Reads every table, recording a failure per table instead of abandoning the snapshot. */
async function readTables(client: Executor, tableNames: string[], pageSize: number) {
  const shapeOf = await readTableShapes(client)
  const tables: Record<string, TableSnapshot> = {}
  const errors: SnapshotError[] = []
  for (let i = 0; i < tableNames.length; i += CONCURRENCY) {
    const batch = tableNames.slice(i, i + CONCURRENCY)
    const results = await Promise.allSettled(
      batch.map((table) => readTable(client, table, shapeOf(table), pageSize)),
    )
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') tables[batch[index]] = result.value
      else errors.push(toSnapshotError(batch[index], result.reason))
    })
  }
  return { tables, errors }
}

export async function takeSnapshot(
  client: Executor,
  pendingMigrations: string[],
  { pageSize = DEFAULT_PAGE_SIZE }: { pageSize?: number } = {},
): Promise<DbSnapshot> {
  const { tableNames, schemaObjects } = await readSchema(client)
  const { tables, errors } = await readTables(client, tableNames, pageSize)
  const foreignKeyViolations = await readForeignKeyViolations(client).catch((error: unknown) => {
    errors.push(toSnapshotError('foreign_key_check', error))
    return null
  })
  return {
    takenAt: new Date().toISOString(),
    pendingMigrations,
    tables,
    schemaObjects,
    foreignKeyViolations,
    errors,
  }
}

async function appliedMigrations(client: Executor): Promise<Set<string>> {
  const exists = await client.execute(
    "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'payload_migrations'",
  )
  if (!exists.rows.length) return new Set()
  const result = await client.execute('SELECT name FROM payload_migrations')
  return new Set(result.rows.map((row) => asString(row.name)))
}

/** Mirrors Payload's readMigrationFiles: every .ts/.js file in the directory except index. */
export async function findPendingMigrations(
  client: Executor,
  migrationDir: string,
): Promise<string[]> {
  const applied = await appliedMigrations(client)
  return (
    fs
      .readdirSync(migrationDir)
      // Matches a .ts or .js extension.
      .filter((file) => /\.(ts|js)$/.test(file) && !['index.ts', 'index.js'].includes(file))
      .map((file) => file.split('.')[0])
      .filter((name) => !applied.has(name))
      .sort()
  )
}
