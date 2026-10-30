import fs from 'fs'
import path from 'path'
import { z } from 'zod'
import type { DbDiffReport, TableDiff } from './types'

/** A subdirectory because Payload's migrate:create reads the last *.json in src/migrations as the schema snapshot. */
export const EXPECTATIONS_DIR = 'expected-changes'

const TABLE_FLAGS = ['dropped', 'deletedRows'] as const
const TABLE_LISTS = [
  'alteredColumns',
  'changedColumns',
  'droppedColumns',
  'droppedConstraints',
] as const
const OBJECT_LISTS = ['droppedObjects', 'alteredObjects'] as const

type TableFlag = (typeof TABLE_FLAGS)[number]
type TableList = (typeof TABLE_LISTS)[number]
type ObjectList = (typeof OBJECT_LISTS)[number]

/** One change to something that existed before the run, in the vocabulary of an expectations file. */
export type Change =
  | { field: TableFlag; table: string }
  | { field: TableList; table: string; value: string }
  | { field: ObjectList; value: string }

const names = z.array(z.string()).optional()

const fileSchema = z
  .object({
    tables: z
      .record(
        z.string(),
        z
          .object({
            dropped: z.literal(true).optional(),
            deletedRows: z.literal(true).optional(),
            alteredColumns: names,
            changedColumns: names,
            droppedColumns: names,
            droppedConstraints: names,
          })
          .strict(),
      )
      .optional(),
    droppedObjects: names,
    alteredObjects: names,
  })
  .strict()

export type ExpectationFile = z.infer<typeof fileSchema>

export type Expectations = {
  changes: Change[]
  /** Expectation files that applied to this run, relative to the migrations directory. */
  sources: string[]
  /** Files that couldn't be read or parsed. */
  errors: string[]
}

export const NO_EXPECTATIONS: Expectations = { changes: [], sources: [], errors: [] }

export const changeKey = (change: Change) =>
  JSON.stringify([
    'table' in change ? change.table : '',
    change.field,
    'value' in change ? change.value : '',
  ])

const DESCRIPTIONS: Record<Change['field'], (value: string) => string> = {
  dropped: () => 'table dropped',
  deletedRows: () => 'rows deleted',
  alteredColumns: (column) => `column \`${column}\` altered`,
  changedColumns: (column) => `existing values changed in \`${column}\``,
  droppedColumns: (column) => `column \`${column}\` dropped`,
  droppedConstraints: (constraint) => `constraint dropped or changed (${constraint})`,
  droppedObjects: (name) => `\`${name}\` dropped`,
  alteredObjects: (name) => `\`${name}\` definition changed`,
}

export function describeChange(change: Change): string {
  const subject = 'table' in change ? `\`${change.table}\`: ` : ''
  return subject + DESCRIPTIONS[change.field]('value' in change ? change.value : '')
}

function tableChanges(diff: TableDiff): Change[] {
  const { table } = diff
  const countDropped = !diff.rowsCompared && diff.rowsAfter < diff.rowsBefore
  const lists: Record<TableList, string[]> = {
    alteredColumns: diff.alteredColumns.map(({ column }) => column),
    changedColumns: Object.keys(diff.changedColumns),
    droppedColumns: diff.droppedColumns,
    droppedConstraints: diff.droppedConstraints,
  }
  return [
    ...TABLE_LISTS.flatMap((field) => lists[field].map((value) => ({ field, table, value }))),
    ...(diff.deletedIds.length || countDropped ? [{ field: 'deletedRows' as const, table }] : []),
  ]
}

/** Every change the report saw to data or schema that existed before the run. */
export function changesIn(report: DbDiffReport): Change[] {
  return [
    ...report.droppedTables.map(({ table }) => ({ field: 'dropped' as const, table })),
    ...report.tables.flatMap(tableChanges),
    ...report.droppedObjects.map(({ name }) => ({ field: 'droppedObjects' as const, value: name })),
    ...report.alteredObjects.map(({ name }) => ({ field: 'alteredObjects' as const, value: name })),
  ]
}

export function toChanges(file: ExpectationFile): Change[] {
  const tables = Object.entries(file.tables ?? {}).flatMap(([table, expected]): Change[] => [
    ...TABLE_FLAGS.filter((field) => expected[field]).map((field) => ({ field, table })),
    ...TABLE_LISTS.flatMap((field) =>
      (expected[field] ?? []).map((value) => ({ field, table, value })),
    ),
  ])
  const objects = OBJECT_LISTS.flatMap((field) =>
    (file[field] ?? []).map((value) => ({ field, value })),
  )
  return [...tables, ...objects]
}

function addChange(file: ExpectationFile, change: Change) {
  if (!('table' in change)) {
    file[change.field] = [...(file[change.field] ?? []), change.value]
    return
  }
  const tables = (file.tables ??= {})
  const entry = (tables[change.table] ??= {})
  if ('value' in change) entry[change.field] = [...(entry[change.field] ?? []), change.value]
  else entry[change.field] = true
}

/** Builds a file from changes, sorted so regenerating it gives a stable diff. */
export function toFile(changes: Change[]): ExpectationFile {
  const file: ExpectationFile = {}
  const sorted = [...changes].sort((a, b) => changeKey(a).localeCompare(changeKey(b)))
  sorted.forEach((change) => addChange(file, change))
  return {
    tables: file.tables,
    droppedObjects: file.droppedObjects,
    alteredObjects: file.alteredObjects,
  }
}

export function parseExpectations(source: string, text: string): ExpectationFile {
  const result = fileSchema.safeParse(JSON.parse(text))
  if (result.success) return result.data
  const issues = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
  throw new Error(`${source} is invalid (${issues.join('; ')})`)
}

/** Reads the expectation file of each migration that has one. */
export function loadExpectations(migrationDir: string, migrations: string[]): Expectations {
  const expectations: Expectations = { changes: [], sources: [], errors: [] }
  for (const migration of migrations) {
    const source = path.join(EXPECTATIONS_DIR, `${migration}.json`)
    const file = path.join(migrationDir, source)
    if (!fs.existsSync(file)) continue
    try {
      expectations.changes.push(
        ...toChanges(parseExpectations(source, fs.readFileSync(file, 'utf8'))),
      )
      expectations.sources.push(source)
    } catch (error) {
      expectations.errors.push(
        error instanceof Error ? error.message : `${source}: ${String(error)}`,
      )
    }
  }
  return expectations
}

export function isExpectedBy(expectations: Expectations): (change: Change) => boolean {
  const keys = new Set(expectations.changes.map(changeKey))
  return (change) => keys.has(changeKey(change))
}

/** Expected changes the run didn't make: the migration did less than its author thought. */
export function unmetExpectations(report: DbDiffReport, expectations: Expectations): Change[] {
  const observed = isExpectedBy({ ...NO_EXPECTATIONS, changes: changesIn(report) })
  return expectations.changes.filter((change) => !observed(change))
}

/**
 * Turns a report into an expectation file for one migration, leaving out changes other pending
 * migrations already expect. Row deletions are only kept if the existing file already declares
 * them, so losing rows always takes a deliberate edit.
 */
export function expectationsFor(
  report: DbDiffReport,
  { others, existing }: { others: Expectations; existing: Expectations },
) {
  const coveredElsewhere = isExpectedBy(others)
  const alreadyDeclared = isExpectedBy(existing)
  const observed = changesIn(report).filter((change) => !coveredElsewhere(change))
  const isNewDeletion = (change: Change) =>
    change.field === 'deletedRows' && !alreadyDeclared(change)
  return {
    file: toFile(observed.filter((change) => !isNewDeletion(change))),
    skippedDeletions: observed.filter(isNewDeletion).map(describeChange),
  }
}
