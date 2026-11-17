'use client'

import { isRecord } from '@/utilities/isRecord'
import { itemTypeOf } from '@/utilities/navItemType'
import { Pill, useRowLabel } from '@payloadcms/ui'
import { useReferenceTitle } from './useReferenceTitle'

type Row = Record<string, unknown>

const text = (value: unknown): string | undefined =>
  typeof value === 'string' && value ? value : undefined

const recordOf = (value: unknown): Row => (isRecord(value) ? value : {})

const subItemCount = (row: Row) => (Array.isArray(row.items) ? row.items.length : 0)

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

const firstText = (...values: unknown[]) => values.map(text).find(Boolean)

// Row paths look like `education.items.0` (item) or `education.items.0.items.2` (sub-item)
const isSubItemPath = (path: string) => /\.items\.\d+\.items\.\d+$/.test(path)

const Label = ({ name, chip, detail }: { name: string; chip?: string; detail?: string }) => (
  <span className="flex items-center gap-2">
    <span className="font-medium">{name}</span>
    {chip && (
      <Pill pillStyle="light-gray" size="small">
        {chip}
      </Pill>
    )}
    {detail && <span className="text-sm text-[var(--theme-elevation-500)]">{detail}</span>}
  </span>
)

const LinkRowLabel = ({ row, fallback, chip }: { row: Row; fallback: string; chip?: string }) => {
  const link = recordOf(row.link)
  const label = text(link.label)
  // Only look the page up when the link doesn't carry its own label
  const title = useReferenceTitle(label ? undefined : link.reference)
  return <Label name={firstText(label, title, link.url) ?? fallback} chip={chip} />
}

const SectionRowLabel = ({ row }: { row: Row }) => (
  <Label
    name={text(row.label) ?? 'Untitled section'}
    chip="Section"
    detail={plural(subItemCount(row), 'sub-item')}
  />
)

const itemFallback = (rowNumber = 0) => `Item ${rowNumber + 1}`

/** Row header for nav items and sub-items: the item's name and, for top-level items, its type. */
export const NavItemRowLabel = () => {
  const { data, path, rowNumber } = useRowLabel<Row>()
  const row = recordOf(data)
  const isSubItem = isSubItemPath(path)
  if (!isSubItem && itemTypeOf(row) === 'section') return <SectionRowLabel row={row} />
  const chip = isSubItem ? undefined : 'Link'
  return <LinkRowLabel row={row} fallback={itemFallback(rowNumber)} chip={chip} />
}
