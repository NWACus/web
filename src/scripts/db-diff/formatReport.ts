import type { DbDiffReport, TableDiff } from './types'

const SAMPLE_SIZE = 10

type Finding = { summary: string; sample?: { label: string; ids: string[] } }

const rows = (count: number) => `${count} row${count === 1 ? '' : 's'}`

function sampleIds(ids: string[]): string {
  const extra = ids.length - SAMPLE_SIZE
  return ids.slice(0, SAMPLE_SIZE).join(', ') + (extra > 0 ? ` … +${extra} more` : '')
}

function describeChangedColumns(changedColumns: Record<string, number>): string {
  return Object.entries(changedColumns)
    .sort(([a, aCount], [b, bCount]) => bCount - aCount || a.localeCompare(b))
    .map(([column, count]) => `${column} ×${count}`)
    .join(', ')
}

function tableFindings(diff: TableDiff): Finding[] {
  const name = `\`${diff.table}\``
  const findings: Finding[] = [
    ...diff.droppedColumns.map((column) => ({ summary: `${name}: column \`${column}\` dropped` })),
    ...diff.alteredColumns.map((change) => ({ summary: `${name}: column altered (${change})` })),
  ]
  if (diff.deletedIds.length) {
    findings.push({
      summary: `${name}: ${rows(diff.deletedIds.length)} deleted`,
      sample: { label: 'deleted ids', ids: diff.deletedIds },
    })
  }
  if (diff.changedIds.length) {
    findings.push({
      summary: `${name}: ${diff.changedIds.length} existing ${diff.changedIds.length === 1 ? 'row' : 'rows'} changed (${describeChangedColumns(diff.changedColumns)})`,
      sample: { label: 'changed ids', ids: diff.changedIds },
    })
  }
  return findings
}

function findings(report: DbDiffReport): Finding[] {
  return [
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

function findingsSection(report: DbDiffReport): string[] {
  const list = findings(report)
  if (!list.length) {
    return ['✅ No existing rows, tables, columns or indexes were removed or changed.']
  }
  return [
    `### ⚠️ ${list.length} ${list.length === 1 ? 'finding' : 'findings'} to review`,
    '',
    ...list.flatMap(({ summary, sample }) =>
      sample ? [`- ${summary}`, `  - ${sample.label}: ${sampleIds(sample.ids)}`] : [`- ${summary}`],
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

function rowCountLine(diff: TableDiff): string {
  const [added, deleted, changed] = diff.rowsCompared
    ? [`+${diff.addedIds.length}`, `${diff.deletedIds.length}`, `${diff.changedIds.length}`]
    : ['—', '—', '—']
  return `| \`${diff.table}\` | ${diff.rowsBefore} | ${diff.rowsAfter} | ${added} | ${deleted} | ${changed} |`
}

function rowCountSection(report: DbDiffReport): string[] {
  if (!report.tables.length) return []
  return [
    '### Tables with changes',
    '',
    '| Table | Before | After | Added | Deleted | Changed |',
    '| --- | --: | --: | --: | --: | --: |',
    ...report.tables.map(rowCountLine),
    ...(report.tables.every((diff) => diff.rowsCompared)
      ? []
      : ['', '— = volatile table, compared by row count only.']),
  ]
}

/** Renders the report as Markdown for the GitHub step summary. */
export function formatReport(report: DbDiffReport): string {
  const migrations = report.migrations.map((name) => `\`${name}\``).join(', ')
  return [
    '## Database diff across migrations',
    '',
    `Migrations pending before the run: ${migrations || 'none'}`,
    '',
    ...findingsSection(report),
    '',
    ...schemaSection(report),
    '',
    ...rowCountSection(report),
    '',
  ].join('\n')
}
