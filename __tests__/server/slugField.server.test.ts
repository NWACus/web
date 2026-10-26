import { slugField, withReservedSlugs } from '@/fields/slug'
import { validateSlug } from '@/utilities/validateSlug'
import type { TextField } from 'payload'

describe('slugField descriptions', () => {
  it('explains auto-generation from the source field and date when enabled', () => {
    const field = slugField('title', { autoGenerateFromDateField: 'startDate' })
    expect(field.admin?.description).toBe(
      'Leave blank to auto-generate from title + start date. Duplicates get a numbered suffix.',
    )
    // Auto-generated slugs may be left blank for the hook to fill in.
    expect(field.required).toBe(false)
  })

  it('names the relationship prefix in the description when one is configured', () => {
    const field = slugField('title', {
      autoGenerateFromDateField: 'startDate',
      prefixFromRelationship: { field: 'provider', collection: 'providers' },
    })
    expect(field.admin?.description).toBe(
      'Leave blank to auto-generate from provider + title + start date. Duplicates get a numbered suffix.',
    )
  })

  it('explains the manual-entry rules when auto-generation is off, using the source field name', () => {
    const field = slugField('name')
    expect(field.admin?.description).toBe(
      'Auto-generated from name. Must be unique; lowercase letters, numbers, and hyphens only.',
    )
    expect(field.required).toBe(true)
  })
})

type SlugValidate = (value: string | null | undefined) => ReturnType<typeof validateSlug>

function callable(validate: TextField['validate']): SlugValidate {
  if (!validate) throw new Error('Slug field has no validate function')
  // @ts-expect-error - Payload types validate for its own call sites; the slug validators read only `value`
  return validate
}

describe('withReservedSlugs', () => {
  const validate = callable(withReservedSlugs(['map', 'station']))

  it('rejects an exact reserved slug', () => {
    expect(validate('map')).toMatch(/reserved/)
    expect(validate('station')).toMatch(/reserved/)
  })

  it('rejects reserved slugs case-insensitively', () => {
    expect(validate('Map')).toMatch(/reserved/)
    expect(validate('STATION')).toMatch(/reserved/)
  })

  it('allows slugs that are not reserved', () => {
    expect(validate('alpental')).toBe(true)
    expect(validate('paradise')).toBe(true)
  })

  it('still applies the base validateSlug rules for invalid characters', () => {
    expect(validate('has spaces')).toMatch(/Invalid slug/)
    expect(validate('has/slash')).toMatch(/cannot contain/)
  })

  it('still allows null/undefined to be caught by the base validator', () => {
    expect(validate(null)).toMatch(/must not be blank/)
    expect(validate(undefined)).toMatch(/must not be blank/)
  })
})

describe('slugField with reservedSlugs option', () => {
  it('uses the reserved-slug validator when reservedSlugs is provided', () => {
    const field = slugField('displayName', { reservedSlugs: ['map', 'station'] })
    const validate = callable(field.validate)
    expect(validate('map')).toMatch(/reserved/)
    expect(validate('alpental')).toBe(true)
  })

  it('uses the standard validator when no reservedSlugs are provided', () => {
    const field = slugField('displayName')
    const validate = callable(field.validate)
    expect(validate('map')).toBe(true)
  })
})
