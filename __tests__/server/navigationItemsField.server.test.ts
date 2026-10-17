import { itemsField } from '@/collections/Navigations/fields/itemsField'
import type { Field, FieldHook, NamedGroupField, RelationshipField } from 'payload'

function findField(fields: Field[], match: (field: Field) => boolean): Field | undefined {
  for (const field of fields) {
    if (match(field)) return field
    if ('fields' in field) {
      const found = findField(field.fields, match)
      if (found) return found
    }
  }
}

function getLinkGroup(): NamedGroupField {
  const field = findField(
    itemsField({ label: 'Nav Items' }).fields,
    (f) => 'name' in f && f.name === 'link',
  )
  if (!field || field.type !== 'group' || !('name' in field))
    throw new Error('link group not found')
  return field
}

function getReferenceValidate() {
  const field = findField([getLinkGroup()], (f) => f.type === 'relationship')
  if (!field || field.type !== 'relationship' || !field.validate)
    throw new Error('link reference validate not found')
  return field.validate
}

function hookArgs(siblingData: Record<string, unknown>, value: unknown) {
  // @ts-expect-error - partial mock of FieldHookArgs
  const args: Parameters<FieldHook>[0] = {
    collection: null,
    context: {},
    data: {},
    siblingData,
    value,
  }
  return args
}

function validateArgs(item: Record<string, unknown>) {
  const reference: Partial<RelationshipField> = { relationTo: ['pages'], required: true }
  return {
    ...reference,
    data: { education: { items: [item] } },
    path: ['education', 'items', 0, 'link', 'reference'],
    req: { t: (key: string) => key },
    siblingData: {},
  }
}

describe('nav item link', () => {
  it('stays visible when the item has sub-items', () => {
    expect(getLinkGroup().admin?.condition).toBeUndefined()
  })

  it('keeps its data when the item has sub-items', () => {
    const hooks = getLinkGroup().hooks?.beforeChange ?? []
    const link = { type: 'internal', reference: { relationTo: 'pages', value: 1 }, newTab: true }
    const siblingData = { label: 'Classes', items: [{ link: { type: 'internal' } }], link }

    for (const hook of hooks) {
      expect(hook(hookArgs(siblingData, link))).toEqual(link)
    }
  })

  it('does not require a page when the item has sub-items', async () => {
    const item = { label: 'Classes', items: [{ link: { type: 'internal' } }], link: {} }

    // @ts-expect-error - partial mock of ValidateOptions
    expect(await getReferenceValidate()(null, validateArgs(item))).toBe(true)
  })

  it('requires a page when the item has no sub-items', async () => {
    const item = { items: [], link: { type: 'internal' } }

    // @ts-expect-error - partial mock of ValidateOptions
    expect(await getReferenceValidate()(null, validateArgs(item))).toBe('validation:required')
  })
})
