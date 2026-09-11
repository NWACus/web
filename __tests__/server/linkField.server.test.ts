import { linkField, linkFields } from '@/fields/linkField'
import { navLink } from '@/fields/navLink'
import { clearIrrelevantLinkValues } from '@/utilities/clearIrrelevantLinkValues'
import type { CheckboxField, Field } from 'payload'

function findField(fields: Field[], name: string): Field | undefined {
  for (const field of fields) {
    if ('name' in field && field.name === name) return field
    if ('fields' in field) {
      const nested = findField(field.fields, name)
      if (nested) return nested
    }
  }
  return undefined
}

function getNewTabField(fields: Field[]): CheckboxField {
  const field = findField(fields, 'newTab')
  if (!field || field.type !== 'checkbox') throw new Error('newTab checkbox not found')
  return field
}

const conditionArgs = {
  blockData: {},
  operation: 'update' as const,
  path: [],
  user: null,
}

// Builds a minimal mock of the hook args; only siblingData and value are read by the hook
function hookArgs(siblingData: Record<string, unknown>, value: unknown) {
  // @ts-expect-error - partial mock of FieldHookArgs
  const args: Parameters<NonNullable<CheckboxField['hooks']>['beforeChange']>[0][0] = {
    collection: null,
    context: {},
    data: {},
    siblingData,
    value,
  }
  return args
}

function runNewTabHook(fields: Field[], siblingData: Record<string, unknown>, value: unknown) {
  const hook = getNewTabField(fields).hooks?.beforeChange?.[0]
  if (!hook) throw new Error('newTab beforeChange hook not found')
  return hook(hookArgs(siblingData, value))
}

describe('link field newTab', () => {
  const variants: [string, Field[]][] = [
    ['button-style group', linkField({ fieldName: 'button', includeLabel: true }).fields],
    ['nav-style group', navLink.fields],
    ['array-row fields', linkFields(true)],
  ]

  describe.each(variants)('%s', (_name, fields) => {
    it('hides the checkbox for internal links and shows it for external links', () => {
      const condition = getNewTabField(fields).admin?.condition
      if (!condition) throw new Error('newTab condition not found')

      expect(condition({}, { type: 'internal' }, conditionArgs)).toBe(false)
      expect(condition({}, { type: 'external' }, conditionArgs)).toBe(true)
    })

    it('clears a value left over from a link that used to be external', () => {
      const siblingData = { type: 'internal', reference: { relationTo: 'pages', value: 1 } }
      expect(runNewTabHook(fields, siblingData, true)).toBeNull()
    })

    it('keeps the value on external links', () => {
      expect(runNewTabHook(fields, { type: 'external' }, true)).toBe(true)
    })

    it('keeps the value on legacy internal links that only carry a url', () => {
      const siblingData = { type: 'internal', url: 'https://example.com', reference: null }
      expect(runNewTabHook(fields, siblingData, true)).toBe(true)
    })

    it('leaves the value alone when the incoming data has no link type', () => {
      expect(runNewTabHook(fields, { label: 'Find an event' }, true)).toBe(true)
    })
  })

  it('defaults to checked only for nav-style links', () => {
    expect(getNewTabField(navLink.fields).defaultValue).toBe(true)
    expect(getNewTabField(linkFields(true)).defaultValue).toBeUndefined()
  })
})

describe('clearIrrelevantLinkValues', () => {
  const hook = (value: unknown) => clearIrrelevantLinkValues(hookArgs({}, value))

  it('clears the external url when the link is internal', () => {
    expect(hook({ type: 'internal', url: 'https://example.com', reference: { id: 1 } })).toEqual({
      type: 'internal',
      reference: { id: 1 },
    })
  })

  it('clears the reference when the link is external', () => {
    expect(
      hook({ type: 'external', url: 'https://example.com', newTab: true, reference: { id: 1 } }),
    ).toEqual({ type: 'external', url: 'https://example.com', newTab: true })
  })

  it('leaves non-object values alone', () => {
    expect(hook(null)).toBeNull()
  })
})
