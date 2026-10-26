'use client'

import { FieldDescription, FieldLabel, Link, Pill, Table } from '@payloadcms/ui'
import type { Column } from 'payload'

export type WhereUsedRow = {
  key: string
  centerName: string
  collectionLabel: string
  title: string
  isDraft: boolean
  href: string
}

// Payload's Table needs a field config per column but never reads it at runtime; these columns
// render nodes we build here rather than values off the row.
const textColumn = (name: string, heading: string, cells: React.ReactNode[]): Column => ({
  accessor: name,
  active: true,
  field: { name, type: 'text' },
  Heading: heading,
  renderedCells: cells,
})

const description = (count: number) =>
  count === 0
    ? 'Nothing uses this yet.'
    : 'Every document that uses this one, across every avalanche center. Drafts are included, because an unpublished page is still something a change would affect.'

export function WhereThisIsUsedTable({ rows }: { rows: WhereUsedRow[] }) {
  const columns: Column[] = [
    textColumn(
      'center',
      'Avalanche Center',
      rows.map((row) => row.centerName),
    ),
    textColumn(
      'collection',
      'Type',
      rows.map((row) => row.collectionLabel),
    ),
    textColumn(
      'document',
      'Document',
      rows.map((row) => (
        <Link href={row.href} key={row.key}>
          {row.title}
        </Link>
      )),
    ),
    textColumn(
      'status',
      'Status',
      rows.map((row) => (
        <Pill key={row.key} pillStyle={row.isDraft ? 'warning' : 'success'} size="small">
          {row.isDraft ? 'Draft' : 'Published'}
        </Pill>
      )),
    ),
  ]

  return (
    <div className="flex flex-col gap-2">
      <FieldLabel label="Where this is used" />
      <FieldDescription description={description(rows.length)} path="" className="mb-2" />
      {rows.length > 0 && (
        <Table
          appearance="condensed"
          columns={columns}
          data={rows.map((row) => ({ id: row.key }))}
        />
      )}
    </div>
  )
}
