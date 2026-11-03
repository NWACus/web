import { disableBulkEditOfHiddenFields } from '@/plugins/disableBulkEditOfHiddenFields'
import type { CollectionConfig, Field } from 'payload'

function bulkEditDisabled(fields: Field[], name: string): boolean | undefined {
  const field = fields.find((candidate) => 'name' in candidate && candidate.name === name)
  return field?.admin && 'disableBulkEdit' in field.admin ? field.admin.disableBulkEdit : undefined
}

describe('disableBulkEditOfHiddenFields', () => {
  const nested: Field[] = [{ name: 'internal', type: 'text', admin: { hidden: true } }]
  const tabbed: Field[] = [{ name: 'tabInternal', type: 'text', admin: { hidden: true } }]
  const media: CollectionConfig = {
    slug: 'media',
    fields: [
      { name: 'alt', type: 'text' },
      { name: 'prefix', type: 'text', admin: { hidden: true, readOnly: true } },
      { name: 'meta', type: 'group', fields: nested },
      { type: 'tabs', tabs: [{ label: 'Details', fields: tabbed }] },
    ],
  }
  disableBulkEditOfHiddenFields({ collections: [media] })

  it('takes fields hidden from the admin out of bulk edit', () => {
    expect(bulkEditDisabled(media.fields, 'prefix')).toBe(true)
  })

  it('leaves visible fields bulk editable', () => {
    expect(bulkEditDisabled(media.fields, 'alt')).toBeUndefined()
    expect(bulkEditDisabled(media.fields, 'meta')).toBeUndefined()
  })

  it('reaches hidden fields inside groups and tabs', () => {
    expect(bulkEditDisabled(nested, 'internal')).toBe(true)
    expect(bulkEditDisabled(tabbed, 'tabInternal')).toBe(true)
  })
})
