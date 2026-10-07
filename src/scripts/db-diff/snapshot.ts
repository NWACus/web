import type { Client, ResultSet, Value } from '@libsql/client'
import { createHash } from 'crypto'
import fs from 'fs'
import type { ColumnInfo, DbSnapshot, SchemaObject, TableSnapshot } from './types'

/** Written to by users and the admin UI rather than migrations, so only their row counts are compared. */
const VOLATILE_TABLES = new Set([
  'payload_kv',
  'payload_locked_documents',
  'payload_locked_documents_rels',
  'payload_preferences',
  'payload_preferences_rels',
  'users_sessions',
])

const PAGE_SIZE = 2000
const CONCURRENCY = 8

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

async function readSchema(client: Client) {
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

async function readColumns(client: Client, table: string): Promise<ColumnInfo[]> {
  const result = await client.execute(`PRAGMA table_info(${quote(table)})`)
  return result.rows.map((row) => ({
    name: asString(row.name),
    type: asString(row.type),
    notNull: Number(row.notnull) === 1,
    defaultValue: row.dflt_value === null ? null : asString(row.dflt_value),
    primaryKey: Number(row.pk),
  }))
}

async function readRowCount(client: Client, table: string): Promise<number> {
  const result = await client.execute(`SELECT count(*) AS count FROM ${quote(table)}`)
  return Number(result.rows[0].count)
}

/** Column 0 of each result row is the rowid; the table's columns follow. */
function addRowHashes(page: ResultSet, keyIndex: number, rows: Record<string, string[]>) {
  for (const row of page.rows) {
    const values = page.columns.slice(1).map((_, index) => row[index + 1])
    rows[asString(row[keyIndex])] = values.map(hashValue)
  }
}

/** Pages by rowid so large tables never come back in one response; rows are keyed by `id`. */
async function readRowHashes(client: Client, table: string, columns: ColumnInfo[]) {
  const names = columns.map((column) => column.name)
  const keyIndex = names.indexOf('id') + 1
  const rows: Record<string, string[]> = {}
  let lastRowid: Value = -1
  for (;;) {
    const page: ResultSet = await client.execute({
      sql: `SELECT rowid, ${names.map(quote).join(', ')} FROM ${quote(table)} WHERE rowid > ? ORDER BY rowid LIMIT ${PAGE_SIZE}`,
      args: [lastRowid],
    })
    addRowHashes(page, keyIndex, rows)
    if (page.rows.length < PAGE_SIZE) return rows
    lastRowid = page.rows[page.rows.length - 1][0]
  }
}

async function readTable(client: Client, table: string): Promise<TableSnapshot> {
  const columns = await readColumns(client, table)
  if (VOLATILE_TABLES.has(table)) {
    return { columns, rowCount: await readRowCount(client, table) }
  }
  const rows = await readRowHashes(client, table, columns)
  return { columns, rowCount: Object.keys(rows).length, rows }
}

async function readForeignKeyViolations(client: Client): Promise<Record<string, number>> {
  const result = await client.execute('PRAGMA foreign_key_check')
  const counts: Record<string, number> = {}
  for (const row of result.rows) {
    const key = `${asString(row.table)} → ${asString(row.parent)}`
    counts[key] = (counts[key] ?? 0) + 1
  }
  return counts
}

export async function takeSnapshot(
  client: Client,
  pendingMigrations: string[],
): Promise<DbSnapshot> {
  const { tableNames, schemaObjects } = await readSchema(client)
  const tables: Record<string, TableSnapshot> = {}
  for (let i = 0; i < tableNames.length; i += CONCURRENCY) {
    const batch = tableNames.slice(i, i + CONCURRENCY)
    const snapshots = await Promise.all(batch.map((table) => readTable(client, table)))
    batch.forEach((table, index) => (tables[table] = snapshots[index]))
  }
  return {
    takenAt: new Date().toISOString(),
    pendingMigrations,
    tables,
    schemaObjects,
    foreignKeyViolations: await readForeignKeyViolations(client),
  }
}

async function appliedMigrations(client: Client): Promise<Set<string>> {
  const exists = await client.execute(
    "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'payload_migrations'",
  )
  if (!exists.rows.length) return new Set()
  const result = await client.execute('SELECT name FROM payload_migrations')
  return new Set(result.rows.map((row) => asString(row.name)))
}

/** Mirrors Payload's readMigrationFiles: every .ts/.js file in the directory except index. */
export async function findPendingMigrations(
  client: Client,
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
