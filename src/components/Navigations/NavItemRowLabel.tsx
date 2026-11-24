'use client'

import { formatSlug } from '@/fields/slug/formatSlug'
import { isRecord } from '@/utilities/isRecord'
import { itemTypeOf } from '@/utilities/navItemType'
import { useForm, useFormFields, useRowLabel } from '@payloadcms/ui'
import { useEffect } from 'react'
import { useReferenceDoc } from './referenceDoc'

type Row = Record<string, unknown>

const text = (value: unknown): string | undefined =>
  typeof value === 'string' && value ? value : undefined

const recordOf = (value: unknown): Row => (isRecord(value) ? value : {})

const subItemCount = (row: Row) => (Array.isArray(row.items) ? row.items.length : 0)

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

// Row paths look like `education.items.0` (item) or `education.items.0.items.2` (sub-item)
const sectionPathOf = (path: string) => path.match(/^(.+\.items\.\d+)\.items\.\d+$/)?.[1]

// The URL segments an item nests under: its tab, then its section's name
const useParentSegments = (path: string) => {
  const sectionPath = sectionPathOf(path)
  const section = useFormFields(([fields]) =>
    sectionPath ? text(fields[`${sectionPath}.label`]?.value) : undefined,
  )
  return [path.split('.')[0], formatSlug(section ?? null)].filter(Boolean)
}

// Rows start collapsed, which would also hide a row that was just added and has nothing in it yet
const useOpenWhenEmpty = (path: string, isEmpty: boolean) => {
  const { dispatchFields, getField } = useForm()
  useEffect(() => {
    if (!isEmpty) return
    const arrayPath = path.replace(/\.\d+$/, '')
    const index = Number(path.slice(arrayPath.length + 1))
    const rows = getField(arrayPath)?.rows ?? []
    if (!rows[index]) return
    dispatchFields({
      type: 'SET_ROW_COLLAPSED',
      path: arrayPath,
      updatedRows: rows.map((row, i) => (i === index ? { ...row, collapsed: false } : row)),
    })
    // Once, when the row appears: an editor can still collapse it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

const Label = ({ name, detail }: { name: string; detail?: string }) => (
  <span className="flex min-w-0 items-baseline gap-3">
    <span className="font-medium">{name}</span>
    {detail && <span className="truncate text-sm text-[var(--theme-elevation-600)]">{detail}</span>}
  </span>
)

const LinkRowLabel = ({ row, path, fallback }: { row: Row; path: string; fallback: string }) => {
  const link = recordOf(row.link)
  const url = text(link.url)
  const isExternal = link.type === 'external'
  const doc = useReferenceDoc(isExternal ? undefined : link.reference, useParentSegments(path))
  useOpenWhenEmpty(path, !link.reference && !url)
  const name = text(link.label) ?? doc.title ?? url ?? fallback
  return <Label name={name} detail={isExternal ? url : (doc.path ?? url)} />
}

const SectionRowLabel = ({ row }: { row: Row }) => (
  <Label
    name={text(row.label) ?? 'Untitled section'}
    detail={`Section with ${plural(subItemCount(row), 'item')}`}
  />
)

const itemFallback = (rowNumber = 0) => `Item ${rowNumber + 1}`

/** Row header for nav items and sub-items: the item's name and its address on the site. */
export const NavItemRowLabel = () => {
  const { data, path, rowNumber } = useRowLabel<Row>()
  const row = recordOf(data)
  if (!sectionPathOf(path) && itemTypeOf(row) === 'section') return <SectionRowLabel row={row} />
  return <LinkRowLabel row={row} path={path} fallback={itemFallback(rowNumber)} />
}
