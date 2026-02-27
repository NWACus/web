/**
 * Checks the latest migration JSON snapshot for regressions against prior snapshots.
 * A "regression" is when changes introduced in snapshot S(k-1) (relative to S(k-2))
 * are missing or reverted in the latest snapshot S(k).
 *
 * This detects the parallel-PR problem where two migrations are developed on separate
 * branches and the second-to-merge has a snapshot that doesn't include the first's changes.
 */

import fs from 'fs'
import path from 'path'

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

interface SnapshotRegression {
  table: string
  type:
    | 'column_added_then_missing'
    | 'column_removed_then_reappears'
    | 'table_added_then_missing'
    | 'table_removed_then_reappears'
  column?: string
  description: string
}

/**
 * Detects regressions between three consecutive snapshots.
 *
 * Compares what changed from snapshotA → snapshotB, then checks if snapshotC
 * reverts any of those changes.
 */
function detectRegressions(
  snapshotA: MigrationSnapshot,
  snapshotB: MigrationSnapshot,
  snapshotC: MigrationSnapshot,
): SnapshotRegression[] {
  const regressions: SnapshotRegression[] = []

  const tablesA = new Set(Object.keys(snapshotA.tables))
  const tablesB = new Set(Object.keys(snapshotB.tables))
  const tablesC = new Set(Object.keys(snapshotC.tables))

  // Tables added in B (not in A) that are missing from C
  for (const table of tablesB) {
    if (!tablesA.has(table) && !tablesC.has(table)) {
      regressions.push({
        table,
        type: 'table_added_then_missing',
        description: `Table was added in the prior snapshot but is missing from the latest snapshot`,
      })
    }
  }

  // Tables removed in B (in A, not in B) that reappear in C
  for (const table of tablesA) {
    if (!tablesB.has(table) && tablesC.has(table)) {
      regressions.push({
        table,
        type: 'table_removed_then_reappears',
        description: `Table was removed in the prior snapshot but reappears in the latest snapshot`,
      })
    }
  }

  // Column-level checks for tables present in all three snapshots
  for (const table of tablesB) {
    if (!tablesA.has(table) || !tablesC.has(table)) continue

    const columnsA = new Set(Object.keys(snapshotA.tables[table].columns))
    const columnsB = new Set(Object.keys(snapshotB.tables[table].columns))
    const columnsC = new Set(Object.keys(snapshotC.tables[table].columns))

    // Columns added in B (not in A) that are missing from C
    for (const column of columnsB) {
      if (!columnsA.has(column) && !columnsC.has(column)) {
        regressions.push({
          table,
          column,
          type: 'column_added_then_missing',
          description: `Column was added in the prior snapshot but is missing from the latest snapshot`,
        })
      }
    }

    // Columns removed in B (in A, not in B) that reappear in C
    for (const column of columnsA) {
      if (!columnsB.has(column) && columnsC.has(column)) {
        regressions.push({
          table,
          column,
          type: 'column_removed_then_reappears',
          description: `Column was removed in the prior snapshot but reappears in the latest snapshot`,
        })
      }
    }
  }

  // Column-level checks for tables added in B that also exist in C
  // (check if the newly added table lost columns)
  for (const table of tablesB) {
    if (tablesA.has(table) || !tablesC.has(table)) continue

    const columnsB = new Set(Object.keys(snapshotB.tables[table].columns))
    const columnsC = new Set(Object.keys(snapshotC.tables[table].columns))

    for (const column of columnsB) {
      if (!columnsC.has(column)) {
        regressions.push({
          table,
          column,
          type: 'column_added_then_missing',
          description: `Column was present when table was added in the prior snapshot but is missing from the latest snapshot`,
        })
      }
    }
  }

  return regressions
}

function getSnapshotFiles(migrationsDir: string): { name: string; path: string }[] {
  return fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.json'))
    .sort() // alphabetical = chronological due to YYYYMMDD_HHMMSS naming
    .map((f) => ({
      name: f,
      path: path.join(migrationsDir, f),
    }))
}

function generateGitHubComment(
  regressions: SnapshotRegression[],
  priorSnapshot: string,
  latestSnapshot: string,
): string {
  let comment = '### Snapshot Consistency Check\n\n'
  comment += `> The latest snapshot \`${latestSnapshot}\` may be missing changes from \`${priorSnapshot}\`.\n\n`
  comment += `Found ${regressions.length} potential regression(s):\n\n`

  // Group by table
  const byTable = new Map<string, SnapshotRegression[]>()
  for (const r of regressions) {
    const existing = byTable.get(r.table) ?? []
    existing.push(r)
    byTable.set(r.table, existing)
  }

  for (const [table, tableRegressions] of byTable) {
    comment += `**Table: \`${table}\`**\n`
    for (const r of tableRegressions) {
      const columnInfo = r.column ? ` (column \`${r.column}\`)` : ''
      comment += `- ${r.description}${columnInfo}\n`
    }
    comment += '\n'
  }

  comment += '---\n\n'
  comment +=
    'This is a warning, not a failure. If the latest migration intentionally reverts ' +
    'changes from the prior migration, this can be ignored. Otherwise, regenerate the ' +
    'snapshot from a branch that includes all prior migrations. ' +
    'See `docs/migration-safety.md` for guidance.\n'

  return comment
}

function main(): number {
  const migrationsDir = path.join(process.cwd(), 'src/migrations')
  const snapshots = getSnapshotFiles(migrationsDir)

  if (snapshots.length < 3) {
    console.log('\nNeed at least 3 snapshots to check for regressions. Skipping.\n')
    return 0
  }

  const [skMinus2, skMinus1, sk] = snapshots.slice(-3)

  console.log('\nChecking snapshot consistency:')
  console.log(`  S(k-2): ${skMinus2.name}`)
  console.log(`  S(k-1): ${skMinus1.name}`)
  console.log(`  S(k):   ${sk.name}\n`)

  const snapshotA: MigrationSnapshot = JSON.parse(fs.readFileSync(skMinus2.path, 'utf-8'))
  const snapshotB: MigrationSnapshot = JSON.parse(fs.readFileSync(skMinus1.path, 'utf-8'))
  const snapshotC: MigrationSnapshot = JSON.parse(fs.readFileSync(sk.path, 'utf-8'))

  const regressions = detectRegressions(snapshotA, snapshotB, snapshotC)

  if (regressions.length === 0) {
    console.log('No snapshot regressions detected.\n')
    return 0
  }

  console.log(`Found ${regressions.length} potential snapshot regression(s):\n`)
  for (const r of regressions) {
    console.log(`  Table: ${r.table}`)
    if (r.column) console.log(`  Column: ${r.column}`)
    console.log(`  Issue: ${r.description}`)
    console.log('')
  }

  console.log(
    'This may indicate the latest migration snapshot was generated from a branch ' +
      'that did not include changes from the prior migration.\n' +
      'If this is intentional, no action is needed. Otherwise, regenerate the snapshot ' +
      'from a branch that includes all prior migrations.\n',
  )

  if (process.env.GITHUB_OUTPUT) {
    const comment = generateGitHubComment(regressions, skMinus1.name, sk.name)
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `snapshot_comment<<EOF\n${comment}\nEOF\n`)
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `has_regressions=true\n`)
  }

  return 0
}

// Guard main() so importing for tests doesn't trigger execution.
// When run via `payload run`, process.argv[1] is payload/bin.js, not this script.
const isTestEnvironment = process.env.JEST_WORKER_ID !== undefined
if (!isTestEnvironment) {
  const exitCode = main()
  process.exit(exitCode)
}

export { detectRegressions }
export type { MigrationSnapshot, SnapshotRegression, TableSchema }
