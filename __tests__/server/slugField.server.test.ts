import { slugField } from '@/fields/slug'

describe('slugField descriptions', () => {
  it('explains auto-generation from the source field and date when enabled', () => {
    const field = slugField('title', { autoGenerateFromDateField: 'startDate' })
    expect(field.admin?.description).toBe(
      'Leave blank to auto-generate from title + start date. Duplicates get a numbered suffix.',
    )
    // Auto-generated slugs may be left blank for the hook to fill in.
    expect(field.required).toBe(false)
  })

  it('explains the manual-entry rules when auto-generation is off, using the source field name', () => {
    const field = slugField('name')
    expect(field.admin?.description).toBe(
      'Auto-generated from name. Must be unique; lowercase letters, numbers, and hyphens only.',
    )
    expect(field.required).toBe(true)
  })
})
