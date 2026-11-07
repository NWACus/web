'use client'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { isRecord } from '@/utilities/isRecord'
import { type NavItemType } from '@/utilities/navItemType'
import { ConfirmationModal, FieldLabel, useForm, useFormFields, useModal } from '@payloadcms/ui'
import { ListTree, SquareArrowOutUpRight } from 'lucide-react'
import type { FormState, UIFieldClientProps } from 'payload'
import { useState } from 'react'
import { fetchReferenceTitle } from './useReferenceTitle'

const options: { value: NavItemType; label: string; icon: typeof ListTree }[] = [
  { value: 'link', label: 'Link to a page', icon: SquareArrowOutUpRight },
  { value: 'section', label: 'Section with sub-items', icon: ListTree },
]

const LINK_KEYS = ['type', 'reference', 'url', 'label', 'newTab'] as const

type Link = Record<string, unknown>

const linkOf = (value: unknown): Link => (isRecord(value) ? value : {})

const hasDestination = (link: Link) => Boolean(link.reference || link.url)

const text = (value: unknown): string | undefined =>
  typeof value === 'string' && value ? value : undefined

// Form state for a new sub-item row carrying `link`, keyed relative to the row
const subItemState = (link: Link): FormState =>
  Object.fromEntries(
    LINK_KEYS.map((key) => [`link.${key}`, { value: link[key], initialValue: link[key] }]),
  )

const firstSubItemLink = (subItems: unknown) =>
  Array.isArray(subItems) ? linkOf(subItems[0]?.link) : {}

const rowCount = (rows: unknown) => (Array.isArray(rows) ? rows.length : 0)

const plural = (count: number) => `${count} sub-item${count === 1 ? '' : 's'}`

const switchToLinkMessage = (count: number, keepsFirst: boolean) =>
  keepsFirst
    ? `The first sub-item becomes this item's link, and the other ${plural(count - 1)} will be removed.`
    : `All ${plural(count)} will be removed, and you'll need to pick this item's page.`

const TypeToggle = ({
  value,
  onChange,
}: {
  value: NavItemType
  onChange: (next: string) => void
}) => (
  <ToggleGroup
    type="single"
    value={value}
    onValueChange={onChange}
    variant="outline"
    className="justify-start"
  >
    {options.map(({ value: option, label, icon: Icon }) => (
      <ToggleGroupItem
        key={option}
        value={option}
        aria-label={label}
        className="cursor-pointer gap-1.5"
      >
        <Icon style={{ width: '16px', height: '16px' }} />
        {label}
      </ToggleGroupItem>
    ))}
  </ToggleGroup>
)

// Moves an item's link into a new first sub-item and back, editing form state directly
const useItemTypeSwitch = (itemPath: string) => {
  const { addFieldRow, dispatchFields, getDataByPath, removeFieldRow } = useForm()
  const subItemsPath = `${itemPath}.items`
  // An array field's form state value is its row count
  const subItemCount = useFormFields(([fields]) => Number(fields[subItemsPath]?.value) || 0)

  const update = (fieldPath: string, value: unknown) =>
    dispatchFields({ type: 'UPDATE', path: fieldPath, value })

  const hasName = () => Boolean(text(getDataByPath(`${itemPath}.label`)))
  // Once the page title loads, the editor may have typed a name or switched back to a link
  const stillUnnamedSection = () => !hasName() && rowCount(getDataByPath(subItemsPath)) > 0

  const nameSection = (link: Link) => {
    if (hasName()) return
    const linkLabel = text(link.label)
    if (linkLabel) return update(`${itemPath}.label`, linkLabel)
    fetchReferenceTitle(link.reference)
      .then((title) => title && stillUnnamedSection() && update(`${itemPath}.label`, title))
      .catch(() => {})
  }

  const toSection = () => {
    const link = linkOf(getDataByPath(`${itemPath}.link`))
    const subFieldState = hasDestination(link) ? subItemState(link) : undefined
    addFieldRow({ path: subItemsPath, rowIndex: 0, schemaPath: subItemsPath, subFieldState })
    nameSection(link)
  }

  const firstLink = () => firstSubItemLink(getDataByPath(subItemsPath))

  const toLink = () => {
    const first = firstLink()
    if (hasDestination(first))
      LINK_KEYS.forEach((key) => update(`${itemPath}.link.${key}`, first[key]))
    for (let row = subItemCount - 1; row >= 0; row--)
      removeFieldRow({ path: subItemsPath, rowIndex: row })
  }

  return { subItemCount, toSection, toLink, keepsFirst: () => hasDestination(firstLink()) }
}

/**
 * Switches a nav item between a link and a section. The type isn't stored: a section is an item
 * with sub-items, so switching adds or removes sub-items and carries the link across. A link
 * becomes the section's first sub-item, and the first sub-item becomes the link.
 */
export const ItemTypePicker = ({ path }: UIFieldClientProps) => {
  // education.items.0.itemType → education.items.0
  const itemPath = path.replace(/\.itemType$/, '')
  const modalSlug = `nav-item-type-${itemPath}`
  const { subItemCount, toSection, toLink, keepsFirst } = useItemTypeSwitch(itemPath)
  const { closeModal, openModal } = useModal()
  const [confirmingKeepsFirst, setConfirmingKeepsFirst] = useState<boolean>()
  const current: NavItemType = subItemCount > 0 ? 'section' : 'link'

  // The modal mounts only while this item is asking, rather than one per nav item
  const requestLink = () => {
    if (subItemCount <= 1) return toLink()
    setConfirmingKeepsFirst(keepsFirst())
    openModal(modalSlug)
  }

  const endConfirming = () => {
    closeModal(modalSlug)
    setConfirmingKeepsFirst(undefined)
  }

  const transitions: Record<string, () => void> = {
    'link>section': toSection,
    'section>link': requestLink,
  }

  return (
    <div className="mb-4">
      <FieldLabel label="Type" />
      <TypeToggle value={current} onChange={(next) => transitions[`${current}>${next}`]?.()} />
      {confirmingKeepsFirst !== undefined && (
        <ConfirmationModal
          modalSlug={modalSlug}
          heading="Switch to a link?"
          body={switchToLinkMessage(subItemCount, confirmingKeepsFirst)}
          confirmLabel="Switch to link"
          onCancel={endConfirming}
          onConfirm={() => {
            toLink()
            endConfirming()
          }}
        />
      )}
    </div>
  )
}
