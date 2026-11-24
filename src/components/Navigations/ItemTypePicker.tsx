'use client'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { isRecord } from '@/utilities/isRecord'
import { type NavItemType } from '@/utilities/navItemType'
import { ConfirmationModal, FieldLabel, useForm, useFormFields, useModal } from '@payloadcms/ui'
import { ListTree, SquareArrowOutUpRight } from 'lucide-react'
import type { UIFieldClientProps } from 'payload'
import { useState } from 'react'
import { fetchReferenceTitle } from './useReferenceTitle'

const options: { value: NavItemType; label: string; icon: typeof ListTree }[] = [
  { value: 'link', label: 'Link to a page', icon: SquareArrowOutUpRight },
  { value: 'section', label: 'Section with sub-items', icon: ListTree },
]

const LINK_KEYS = ['type', 'reference', 'url', 'label', 'newTab'] as const

const linkOf = (value: unknown): Record<string, unknown> => (isRecord(value) ? value : {})

const hasDestination = (link: Record<string, unknown>) => Boolean(link.reference || link.url)

const plural = (count: number) => `${count} sub-item${count === 1 ? '' : 's'}`

// Moves an item's link into a new first sub-item and back, editing form state directly
const useItemTypeSwitch = (itemPath: string) => {
  const { addFieldRow, dispatchFields, getDataByPath, getField, removeFieldRow } = useForm()
  const labelPath = `${itemPath}.label`
  const subItemsPath = `${itemPath}.items`
  // An array field's form state value is its row count
  const subItemCount = useFormFields(([fields]) => Number(fields[subItemsPath]?.value) || 0)

  const update = (path: string, value: unknown) => dispatchFields({ type: 'UPDATE', path, value })
  // The server decides which fields show, a form refresh after the switch. Setting visibility here
  // swaps them right away. Whole field states are replaced, so this has to run before rows change.
  const showFields = (visibility: Record<string, boolean>) =>
    dispatchFields({
      type: 'UPDATE_MANY',
      formState: Object.fromEntries(
        Object.entries(visibility).map(([name, passesCondition]) => [
          `${itemPath}.${name}`,
          { ...getField(`${itemPath}.${name}`), passesCondition },
        ]),
      ),
    })
  const hasName = () => Boolean(getDataByPath(labelPath))
  const subItems = () => {
    const rows: unknown = getDataByPath(subItemsPath)
    return Array.isArray(rows) ? rows : []
  }
  const firstLink = () => linkOf(subItems()[0]?.link)

  const nameSection = (link: Record<string, unknown>) => {
    if (hasName()) return
    if (link.label) return update(labelPath, link.label)
    fetchReferenceTitle(link.reference)
      .then((title) => {
        // The editor may have typed a name or switched back to a link while the title loaded
        if (title && !hasName() && subItems().length > 0) update(labelPath, title)
      })
      .catch(() => {})
  }

  const toSection = () => {
    const link = linkOf(getDataByPath(`${itemPath}.link`))
    const subFieldState = hasDestination(link)
      ? Object.fromEntries(
          LINK_KEYS.map((key) => [`link.${key}`, { value: link[key], initialValue: link[key] }]),
        )
      : undefined
    showFields({ label: true, items: true, link: false })
    addFieldRow({ path: subItemsPath, rowIndex: 0, schemaPath: subItemsPath, subFieldState })
    nameSection(link)
  }

  const toLink = () => {
    const first = firstLink()
    const current = linkOf(getDataByPath(`${itemPath}.link`))
    const isExternal = (hasDestination(first) ? first : current).type === 'external'
    showFields({
      label: false,
      items: false,
      link: true,
      'link.type': true,
      'link.label': true,
      'link.reference': !isExternal,
      'link.url': isExternal,
      'link.newTab': isExternal,
    })
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
  const [confirmMessage, setConfirmMessage] = useState<string>()

  // The modal mounts only while this item is asking, rather than one per nav item
  const requestLink = () => {
    if (subItemCount <= 1) return toLink()
    setConfirmMessage(
      keepsFirst()
        ? `The first sub-item becomes this item's link, and the other ${plural(subItemCount - 1)} will be removed.`
        : `All ${plural(subItemCount)} will be removed, and you'll need to pick this item's page.`,
    )
    openModal(modalSlug)
  }

  const endConfirming = () => {
    closeModal(modalSlug)
    setConfirmMessage(undefined)
  }

  // Clicking the current type emits ''
  const onChange = (next: string) => {
    if (next === 'section') toSection()
    if (next === 'link') requestLink()
  }

  return (
    <div className="mb-4">
      <FieldLabel label="Type" />
      <ToggleGroup
        type="single"
        value={subItemCount > 0 ? 'section' : 'link'}
        onValueChange={onChange}
        variant="outline"
        className="justify-start"
      >
        {options.map(({ value, label, icon: Icon }) => (
          <ToggleGroupItem
            key={value}
            value={value}
            aria-label={label}
            className="cursor-pointer gap-1.5"
          >
            <Icon style={{ width: '16px', height: '16px' }} />
            {label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {confirmMessage && (
        <ConfirmationModal
          modalSlug={modalSlug}
          heading="Switch to a link?"
          body={confirmMessage}
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
