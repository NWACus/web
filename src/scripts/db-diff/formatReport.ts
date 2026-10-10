import type { DbDiffReport, TableDiff } from './types'

const SAMPLE_SIZE = 10

/** `detail` holds row ids and error messages, which stay out of public CI output. */
type Finding = { summary: string; detail?: string }

const rows = (count: number) => `${count} row${count === 1 ? '' : 's'}`

function sampleIds(label: string, ids: string[]): string {
  const extra = ids.length - SAMPLE_SIZE
  return `${label}: ${ids.slice(0, SAMPLE_SIZE).join(', ')}${extra > 0 ? ` … +${extra} more` : ''}`
}

function describeChangedColumns(changedColumns: Record<string, number>): string {
  return Object.entries(changedColumns)
    .sort(([a, aCount], [b, bCount]) => bCount - aCount || a.localeCompare(b))
    .map(([column, count]) => `${column} ×${count}`)
    .join(', ')
}

function schemaFindings(name: string, diff: TableDiff): Finding[] {
  return [
    ...diff.droppedColumns.map((column) => ({ summary: `${name}: column \`${column}\` dropped` })),
    ...diff.alteredColumns.map((change) => ({ summary: `${name}: column altered (${change})` })),
    ...diff.droppedConstraints.map((constraint) => ({
      summary: `${name}: constraint dropped or changed (${constraint})`,
    })),
  ]
}

function rowFindings(name: string, diff: TableDiff): Finding[] {
  const findings: Finding[] = []
  const countDrop = diff.rowsBefore - diff.rowsAfter
  if (!diff.rowsCompared && countDrop > 0) {
    findings.push({ summary: `${name}: row count dropped by ${countDrop} (count-only table)` })
  }
  if (diff.deletedIds.length) {
    findings.push({
      summary: `${name}: ${rows(diff.deletedIds.length)} deleted`,
      detail: sampleIds('deleted ids', diff.deletedIds),
    })
  }
  if (diff.changedIds.length) {
    findings.push({
      summary: `${name}: ${diff.changedIds.length} existing ${diff.changedIds.length === 1 ? 'row' : 'rows'} changed (${describeChangedColumns(diff.changedColumns)})`,
      detail: sampleIds('changed ids', diff.changedIds),
    })
  }
  return findings
}

function tableFindings(diff: TableDiff): Finding[] {
  const name = `\`${diff.table}\``
  return [...schemaFindings(name, diff), ...rowFindings(name, diff)]
}

function findings(report: DbDiffReport): Finding[] {
  return [
    ...report.failures.map(({ target, code, message, snapshot }) => ({
      summary: `\`${target}\`: couldn't be read in the ${snapshot} snapshot (${code}), so it wasn't compared`,
      detail: message,
    })),
    ...report.droppedTables.map(({ table, rows: count }) => ({
      summary: `\`${table}\`: table dropped (${rows(count)})`,
    })),
    ...report.tables.flatMap(tableFindings),
    ...report.droppedObjects.map((object) => ({ summary: `${object} dropped` })),
    ...report.alteredObjects.map((object) => ({ summary: `${object} definition changed` })),
    ...(report.newForeignKeyViolations.length
      ? [{ summary: `foreign key violations: ${report.newForeignKeyViolations.join(', ')}` }]
      : []),
  ]
}

/** Changes to data or schema that existed before the migrations ran: the ones worth a human look. */
export function findingsFor(report: DbDiffReport): string[] {
  return findings(report).map((finding) => finding.summary)
}

function findingsSection(report: DbDiffReport, detailed: boolean): string[] {
  const list = findings(report)
  if (!list.length) {
    return ['✅ No existing rows, tables, columns, constraints or indexes were removed or changed.']
  }
  return [
    `### ⚠️ ${list.length} ${list.length === 1 ? 'finding' : 'findings'} to review`,
    '',
    ...list.flatMap(({ summary, detail }) =>
      detailed && detail ? [`- ${summary}`, `  - ${detail}`] : [`- ${summary}`],
    ),
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
    ['Indexes, triggers and views added', report.addedObjects],
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
export function formatReport(report: DbDiffReport, { detailed }: { detailed: boolean }): string {
  const migrations = report.migrations.map((name) => `\`${name}\``).join(', ')
  return [
    '## Database diff across migrations',
    '',
    `Migrations pending before the run: ${migrations || 'none'}`,
    '',
    ...findingsSection(report, detailed),
    '',
    ...schemaSection(report),
    '',
    ...rowCountSection(report, detailed),
    '',
  ].join('\n')
}
