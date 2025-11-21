/**
 * Analyzes migration schema snapshots to show high-level changes between versions.
 * Provides a concise summary of tables added, removed, and modified.
 */

import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

interface TableFieldDiff {
  fieldsAdded: string[]
  fieldsRemoved: string[]
  fieldsModified: string[]
}

interface DiffAnalysis {
  migrationName: string
  tablesAdded: string[]
  tablesRemoved: string[]
  tablesModified: Map<string, TableFieldDiff>
}

interface MigrationSnapshot {
  version: string
  dialect: string
  tables: Record<string, TableSchema>
}

interface TableSchema {
  name: string
  columns: Record<string, unknown>
  indexes?: Record<string, unknown>
  foreignKeys?: Record<string, unknown>
  compositePrimaryKeys?: Record<string, unknown>
  uniqueConstraints?: Record<string, unknown>
  checkConstraints?: Record<string, unknown>
}

function hashObject(obj: unknown): string {
  return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex')
}

function diffTableFields(oldTable: TableSchema, newTable: TableSchema): TableFieldDiff {
  const oldColumns = new Set(Object.keys(oldTable.columns))
  const newColumns = new Set(Object.keys(newTable.columns))

  const fieldsAdded: string[] = []
  const fieldsRemoved: string[] = []
  const fieldsModified: string[] = []

  // Find added columns
  for (const column of newColumns) {
    if (!oldColumns.has(column)) {
      fieldsAdded.push(column)
    }
  }

  // Find removed columns
  for (const column of oldColumns) {
    if (!newColumns.has(column)) {
      fieldsRemoved.push(column)
    }
  }

  // Find modified columns (in both, but with different definition)
  for (const column of newColumns) {
    if (oldColumns.has(column)) {
      const oldHash = hashObject(oldTable.columns[column])
      const newHash = hashObject(newTable.columns[column])
      if (oldHash !== newHash) {
        fieldsModified.push(column)
      }
    }
  }

  return {
    fieldsAdded: fieldsAdded.sort(),
    fieldsRemoved: fieldsRemoved.sort(),
    fieldsModified: fieldsModified.sort(),
  }
}

function compareMigrationSnapshots(oldSnapshotPath: string, newSnapshotPath: string): DiffAnalysis {
  // Extract migration name from the new snapshot path
  const migrationName = path.basename(newSnapshotPath, '.json')

  // Read and parse both JSON files
  const oldSnapshot: MigrationSnapshot = JSON.parse(fs.readFileSync(oldSnapshotPath, 'utf-8'))
  const newSnapshot: MigrationSnapshot = JSON.parse(fs.readFileSync(newSnapshotPath, 'utf-8'))

  const oldTables = new Set(Object.keys(oldSnapshot.tables))
  const newTables = new Set(Object.keys(newSnapshot.tables))

  const tablesAdded: string[] = []
  const tablesRemoved: string[] = []
  const tablesModified = new Map<string, TableFieldDiff>()

  // Find added tables (in new but not in old)
  for (const table of newTables) {
    if (!oldTables.has(table)) {
      tablesAdded.push(table)
    }
  }

  // Find removed tables (in old but not in new)
  for (const table of oldTables) {
    if (!newTables.has(table)) {
      tablesRemoved.push(table)
    }
  }

  // Find modified tables (in both, but with different content)
  for (const table of newTables) {
    if (oldTables.has(table)) {
      const oldHash = hashObject(oldSnapshot.tables[table])
      const newHash = hashObject(newSnapshot.tables[table])
      if (oldHash !== newHash) {
        const fieldDiff = diffTableFields(oldSnapshot.tables[table], newSnapshot.tables[table])
        tablesModified.set(table, fieldDiff)
      }
    }
  }

  return {
    migrationName,
    tablesAdded: tablesAdded.sort(),
    tablesRemoved: tablesRemoved.sort(),
    tablesModified,
  }
}

function formatAnalysis(analysis: DiffAnalysis): string {
  const { migrationName, tablesAdded, tablesRemoved, tablesModified } = analysis

  let output = `\n📊 Migration Analysis: ${migrationName}\n`
  output += '='.repeat(60) + '\n\n'

  if (tablesAdded.length > 0) {
    output += `✅ Tables Added (${tablesAdded.length}):\n`
    tablesAdded.forEach((table) => {
      output += `   • ${table}\n`
    })
    output += '\n'
  }

  if (tablesRemoved.length > 0) {
    output += `❌ Tables Removed (${tablesRemoved.length}):\n`
    tablesRemoved.forEach((table) => {
      output += `   • ${table}\n`
    })
    output += '\n'
  }

  if (tablesModified.size > 0) {
    output += `📝 Tables Modified (${tablesModified.size}):\n`
    // Sort table names for consistent output
    const sortedTables = Array.from(tablesModified.keys()).sort()

    sortedTables.forEach((table) => {
      const diff = tablesModified.get(table)
      if (!diff) return

      output += `   • ${table}\n`

      if (diff.fieldsAdded.length > 0) {
        output += `     + Fields added: ${diff.fieldsAdded.join(', ')}\n`
      }
      if (diff.fieldsRemoved.length > 0) {
        output += `     - Fields removed: ${diff.fieldsRemoved.join(', ')}\n`
      }
      if (diff.fieldsModified.length > 0) {
        output += `     ~ Fields modified: ${diff.fieldsModified.join(', ')}\n`
      }
    })
    output += '\n'
  }

  if (tablesAdded.length === 0 && tablesRemoved.length === 0 && tablesModified.size === 0) {
    output += '📭 No table-level changes detected\n\n'
  }

  return output
}

// CLI usage
function main() {
  const migrationsDir = path.join(process.cwd(), 'src/migrations')

  // Get all JSON migration snapshot files, sorted by modification time (newest first)
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => ({
      name: f,
      path: path.join(migrationsDir, f),
      mtime: fs.statSync(path.join(migrationsDir, f)).mtime.getTime(),
    }))
    .sort((a, b) => b.mtime - a.mtime)

  if (migrationFiles.length < 2) {
    console.error('❌ Need at least 2 migration snapshots to compare')
    process.exit(1)
  }

  // Compare the two most recent snapshots
  const newSnapshot = migrationFiles[0]
  const oldSnapshot = migrationFiles[1]

  console.log(`\n🔍 Comparing snapshots:`)
  console.log(`   Old: ${oldSnapshot.name}`)
  console.log(`   New: ${newSnapshot.name}`)

  const analysis = compareMigrationSnapshots(oldSnapshot.path, newSnapshot.path)
  const output = formatAnalysis(analysis)

  console.log(output)
}

main()
