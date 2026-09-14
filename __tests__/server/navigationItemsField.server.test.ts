import { itemsField } from '@/collections/Navigations/fields/itemsField'
import type { Field, FieldHook, NamedGroupField } from 'payload'

function getLinkGroup(): NamedGroupField {
  const field = itemsField({ label: 'Nav Items' }).fields.find(
    (f: Field) => 'name' in f && f.name === 'link',
  )
  if (!field || field.type !== 'group' || !('name' in field))
    throw new Error('link group not found')
  return field
}

// The item-level cleanup hook is the last one on the link group
function getClearLinkHook(): FieldHook {
  const hooks = getLinkGroup().hooks?.beforeChange
  if (!hooks?.length) throw new Error('link group beforeChange hooks not found')
  return hooks[hooks.length - 1]
}

// Only siblingData and value are read by the hook
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

describe('nav item link cleanup', () => {
  const link = { type: 'internal', reference: { relationTo: 'pages', value: 1 }, newTab: true }

  it('clears the link sub-fields when the item has sub-items', () => {
    const siblingData = { label: 'Classes', items: [{ link: { type: 'internal' } }], link }

    expect(getClearLinkHook()(hookArgs(siblingData, link))).toEqual({
      type: 'internal',
      reference: null,
      url: null,
      label: null,
      newTab: null,
    })
  })

  // Payload traverses a group's sub-fields using the value this hook returns as their siblingData,
  // and reads siblingData[name] to build each sub-field hook's args. Returning null there makes
  // every sub-field hook throw, which would break saving any navigation with an accordion item.
  it('never returns null, so the group sub-field hooks still have siblingData', () => {
    const siblingData = { label: 'Classes', items: [{ link: { type: 'internal' } }], link }

    expect(getClearLinkHook()(hookArgs(siblingData, link))).not.toBeNull()
  })

  it('leaves the link alone when the item has no sub-items', () => {
    expect(getClearLinkHook()(hookArgs({ items: [], link }, link))).toBe(link)
  })
})
