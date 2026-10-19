import { slugField, withReservedSlugs } from '@/fields/slug'
import { validateSlug } from '@/utilities/validateSlug'

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

// Minimal args stub — validateSlug only inspects `value`, not the rest of the args
const stubArgs = {} as Parameters<typeof validateSlug>[1]

describe('withReservedSlugs', () => {
  const validate = withReservedSlugs(['map', 'station'])

  it('rejects an exact reserved slug', () => {
    expect(validate('map', stubArgs)).toMatch(/reserved/)
    expect(validate('station', stubArgs)).toMatch(/reserved/)
  })

  it('rejects reserved slugs case-insensitively', () => {
    expect(validate('Map', stubArgs)).toMatch(/reserved/)
    expect(validate('STATION', stubArgs)).toMatch(/reserved/)
  })

  it('allows slugs that are not reserved', () => {
    expect(validate('alpental', stubArgs)).toBe(true)
    expect(validate('paradise', stubArgs)).toBe(true)
  })

  it('still applies the base validateSlug rules for invalid characters', () => {
    expect(validate('has spaces', stubArgs)).toMatch(/Invalid slug/)
    expect(validate('has/slash', stubArgs)).toMatch(/cannot contain/)
  })

  it('still allows null/undefined to be caught by the base validator', () => {
    expect(validate(null, stubArgs)).toMatch(/must not be blank/)
    expect(validate(undefined, stubArgs)).toMatch(/must not be blank/)
  })
})

describe('slugField with reservedSlugs option', () => {
  it('uses the reserved-slug validator when reservedSlugs is provided', () => {
    const field = slugField('displayName', { reservedSlugs: ['map', 'station'] })
    // The validate function should reject reserved slugs
    const validate = field.validate!
    expect(validate('map', stubArgs)).toMatch(/reserved/)
    expect(validate('alpental', stubArgs)).toBe(true)
  })

  it('uses the standard validator when no reservedSlugs are provided', () => {
    const field = slugField('displayName')
    const validate = field.validate!
    // "map" is a valid slug when not reserved
    expect(validate('map', stubArgs)).toBe(true)
  })
})
