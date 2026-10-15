import {
  NO_EXPECTATIONS,
  describeChange,
  isExpectedBy,
  unmetExpectations,
  type Change,
  type Expectations,
} from './expectations'
import type { DbDiffReport, SchemaObjectRef, TableDiff } from './types'

const SAMPLE_SIZE = 10

/** `detail` holds row ids and error messages, which stay out of public CI output. */
type Finding = { summary: string; detail?: string; expected?: boolean }
type IsExpected = (change: Change) => boolean

const rows = (count: number) => `${count} row${count === 1 ? '' : 's'}`

const label = ({ type, name }: SchemaObjectRef) => `${type} \`${name}\``

function sampleIds(label: string, ids: string[]): string {
  const extra = ids.length - SAMPLE_SIZE
  return `${label}: ${ids.slice(0, SAMPLE_SIZE).join(', ')}${extra > 0 ? ` … +${extra} more` : ''}`
}

function describeChangedColumns(changedColumns: [string, number][]): string {
  return changedColumns
    .sort(([a, aCount], [b, bCount]) => bCount - aCount || a.localeCompare(b))
    .map(([column, count]) => `${column} ×${count}`)
    .join(', ')
}

function schemaFindings(name: string, diff: TableDiff, isExpected: IsExpected): Finding[] {
  const { table } = diff
  return [
    ...diff.droppedColumns.map((column) => ({
      summary: `${name}: column \`${column}\` dropped`,
      expected: isExpected({ field: 'droppedColumns', table, value: column }),
    })),
    ...diff.alteredColumns.map(({ column, change }) => ({
      summary: `${name}: column altered (${column}: ${change})`,
      expected: isExpected({ field: 'alteredColumns', table, value: column }),
    })),
    ...diff.droppedConstraints.map((constraint) => ({
      summary: `${name}: constraint dropped or changed (${constraint})`,
      expected: isExpected({ field: 'droppedConstraints', table, value: constraint }),
    })),
  ]
}

function deletedRowFindings(name: string, diff: TableDiff, isExpected: IsExpected): Finding[] {
  const expected = isExpected({ field: 'deletedRows', table: diff.table })
  const countDrop = diff.rowsBefore - diff.rowsAfter
  const findings: Finding[] = []
  if (!diff.rowsCompared && countDrop > 0) {
    findings.push({
      summary: `${name}: row count dropped by ${countDrop} (count-only table)`,
      expected,
    })
  }
  if (diff.deletedIds.length) {
    findings.push({
      summary: `${name}: ${rows(diff.deletedIds.length)} deleted`,
      detail: sampleIds('deleted ids', diff.deletedIds),
      expected,
    })
  }
  return findings
}

/** Splits changed columns into expected and unexpected ones, so an expected backfill doesn't hide a stray write. */
function changedRowFindings(name: string, diff: TableDiff, isExpected: IsExpected): Finding[] {
  if (!diff.changedIds.length) return []
  const columns = Object.entries(diff.changedColumns)
  const isExpectedColumn = ([column]: [string, number]) =>
    isExpected({ field: 'changedColumns', table: diff.table, value: column })
  const expected = columns.filter(isExpectedColumn)
  const unexpected = columns.filter((column) => !isExpectedColumn(column))
  const detail = sampleIds('changed ids', diff.changedIds)
  if (!expected.length) {
    const count = diff.changedIds.length
    return [
      {
        summary: `${name}: ${count} existing ${count === 1 ? 'row' : 'rows'} changed (${describeChangedColumns(unexpected)})`,
        detail,
      },
    ]
  }
  return [
    {
      summary: `${name}: existing rows changed (${describeChangedColumns(expected)})`,
      expected: true,
    },
    ...(unexpected.length
      ? [
          {
            summary: `${name}: existing rows changed in unexpected columns (${describeChangedColumns(unexpected)})`,
            detail,
          },
        ]
      : []),
  ]
}

function tableFindings(diff: TableDiff, isExpected: IsExpected): Finding[] {
  const name = `\`${diff.table}\``
  return [
    ...schemaFindings(name, diff, isExpected),
    ...deletedRowFindings(name, diff, isExpected),
    ...changedRowFindings(name, diff, isExpected),
  ]
}

function objectFindings(report: DbDiffReport, isExpected: IsExpected): Finding[] {
  return [
    ...report.droppedObjects.map((object) => ({
      summary: `${label(object)} dropped`,
      expected: isExpected({ field: 'droppedObjects', value: object.name }),
    })),
    ...report.alteredObjects.map((object) => ({
      summary: `${label(object)} definition changed`,
      expected: isExpected({ field: 'alteredObjects', value: object.name }),
    })),
  ]
}

function expectationFindings(report: DbDiffReport, expectations: Expectations): Finding[] {
  return [
    ...expectations.errors.map((error) => ({ summary: `expectations not applied: ${error}` })),
    ...unmetExpectations(report, expectations).map((change) => ({
      summary: `expected but didn't happen: ${describeChange(change)}`,
    })),
  ]
}

function findings(report: DbDiffReport, expectations: Expectations): Finding[] {
  const isExpected = isExpectedBy(expectations)
  return [
    ...report.failures.map(({ target, code, message, snapshot }) => ({
      summary: `\`${target}\`: couldn't be read in the ${snapshot} snapshot (${code}), so it wasn't compared`,
      detail: message,
    })),
    ...report.droppedTables.map(({ table, rows: count }) => ({
      summary: `\`${table}\`: table dropped (${rows(count)})`,
      expected: isExpected({ field: 'dropped', table }),
    })),
    ...report.tables.flatMap((diff) => tableFindings(diff, isExpected)),
    ...objectFindings(report, isExpected),
    ...(report.newForeignKeyViolations.length
      ? [{ summary: `foreign key violations: ${report.newForeignKeyViolations.join(', ')}` }]
      : []),
    ...expectationFindings(report, expectations),
  ]
}

/**
 * Changes to data or schema that existed before the migrations ran and that no expectation file
 * declared: the ones worth a human look.
 */
export function findingsFor(report: DbDiffReport, expectations = NO_EXPECTATIONS): string[] {
  return findings(report, expectations)
    .filter((finding) => !finding.expected)
    .map((finding) => finding.summary)
}

function findingsSection(report: DbDiffReport, detailed: boolean, expectations: Expectations) {
  const list = findings(report, expectations)
  const unexpected = list.filter((finding) => !finding.expected)
  const expected = list.filter((finding) => finding.expected)
  const sources = expectations.sources.map((source) => `\`${source}\``).join(', ')
  return [
    ...(unexpected.length
      ? [
          `### ⚠️ ${unexpected.length} ${unexpected.length === 1 ? 'finding' : 'findings'} to review`,
          '',
          ...unexpected.flatMap(({ summary, detail }) =>
            detailed && detail ? [`- ${summary}`, `  - ${detail}`] : [`- ${summary}`],
          ),
        ]
      : [
          expected.length
            ? '✅ Every change to existing rows, tables, columns, constraints or indexes was expected.'
            : '✅ No existing rows, tables, columns, constraints or indexes were removed or changed.',
        ]),
    ...(expected.length
      ? [
          '',
          `### Expected changes (${sources})`,
          '',
          ...expected.map(({ summary }) => `- ${summary}`),
        ]
      : []),
  ]
}

function schemaSection(report: DbDiffReport): string[] {
  const code = (value: string) => `\`${value}\``
  const lines = [
    ['Tables added', report.addedTables.map(({ table, rows: n }) => `${code(table)} (${rows(n)})`)],
    [
      'Columns added',
      report.tables.flatMap((diff) => diff.addedColumns.map((c) => code(`${diff.table}.${c}`))),
    ],
    [
      'Constraints added',
      report.tables.flatMap((diff) => diff.addedConstraints.map((c) => `${code(diff.table)} ${c}`)),
    ],
    ['Indexes, triggers and views added', report.addedObjects.map(label)],
  ] satisfies [string, string[]][]
  const items = lines.filter(([, values]) => values.length)
  if (!items.length) return []
  return [
    '### Schema additions',
    '',
    ...items.map(([label, values]) => `- ${label}: ${values.join(', ')}`),
  ]
}

function rowDeltas(diff: TableDiff): string[] {
  if (diff.rowsCompared) {
    return [`+${diff.addedIds.length}`, `${diff.deletedIds.length}`, `${diff.changedIds.length}`]
  }
  const delta = diff.rowsAfter - diff.rowsBefore
  return [`+${Math.max(delta, 0)}`, `${Math.max(-delta, 0)}`, '—']
}

function rowCountSection(report: DbDiffReport, detailed: boolean): string[] {
  if (!report.tables.length) return []
  const totals = (diff: TableDiff) => (detailed ? [`${diff.rowsBefore}`, `${diff.rowsAfter}`] : [])
  const header = detailed ? ['Table', 'Before', 'After'] : ['Table']
  const line = (cells: string[]) => `| ${cells.join(' | ')} |`
  return [
    '### Tables with changes',
    '',
    line([...header, 'Added', 'Deleted', 'Changed']),
    line(['---', ...Array(header.length + 2).fill('--:')]),
    ...report.tables.map((diff) =>
      line([`\`${diff.table}\``, ...totals(diff), ...rowDeltas(diff)]),
    ),
    ...(report.tables.every((diff) => diff.rowsCompared)
      ? []
      : ['', '— = volatile table: only its row count is compared.']),
  ]
}

/**
 * Renders the report as Markdown. Without `detailed`, it leaves out row ids, table sizes and error
 * messages, because CI logs and step summaries on this public repo are world-readable.
 */
export function formatReport(
  report: DbDiffReport,
  { detailed, expectations = NO_EXPECTATIONS }: { detailed: boolean; expectations?: Expectations },
): string {
  const migrations = report.migrations.map((name) => `\`${name}\``).join(', ')
  return [
    '## Database diff across migrations',
    '',
    `Migrations pending before the run: ${migrations || 'none'}`,
    '',
    ...findingsSection(report, detailed, expectations),
    '',
    ...schemaSection(report),
    '',
    ...rowCountSection(report, detailed),
    '',
  ].join('\n')
}
