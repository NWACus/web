import { mediaSourceFields } from '@/fields/mediaSource'
import type { Field, UploadField } from 'payload'

const fields = mediaSourceFields({ name: 'media' })

function uploadFieldNamed(name: string): UploadField {
  const field: Field | undefined = fields.find((f) => 'name' in f && f.name === name)
  if (!field || field.type !== 'upload') {
    throw new Error(`No upload field named ${name} in the media source field set`)
  }
  return field
}

// The field configs type `validate` and `condition` for Payload's own call sites, which pass far
// more than these functions read.
type SlotValidate = (
  value: number | null,
  options: { siblingData: Record<string, unknown> },
) => Promise<string | true> | string | true

type SlotCondition = (
  data: Record<string, unknown>,
  siblingData: Record<string, unknown>,
) => boolean

function validateFor(name: string): SlotValidate {
  const validate = uploadFieldNamed(name).validate
  if (!validate) throw new Error(`Upload field ${name} has no validate function`)
  // @ts-expect-error - Payload types validate for its own call sites, which pass far more than this
  return validate
}

function conditionFor(name: string): SlotCondition {
  const condition = uploadFieldNamed(name).admin?.condition
  if (!condition) throw new Error(`Upload field ${name} has no admin condition`)
  // @ts-expect-error - Payload types condition for its own call sites, which pass far more than this
  return condition
}

describe('mediaSourceFields', () => {
  it('offers both libraries, defaulting to the center', () => {
    const source = fields.find((f) => 'name' in f && f.name === 'source')
    expect(source).toMatchObject({
      type: 'radio',
      defaultValue: 'center',
      options: [
        { label: 'Center library', value: 'center' },
        { label: 'Shared library', value: 'shared' },
      ],
    })
  })

  it('points the two upload fields at the two libraries', () => {
    expect(uploadFieldNamed('media').relationTo).toBe('media')
    expect(uploadFieldNamed('sharedMedia').relationTo).toBe('sharedMedia')
  })

  describe('validation', () => {
    it("requires the center's library when source is center or absent", () => {
      const validate = validateFor('media')
      expect(validate(null, { siblingData: { source: 'center' } })).toEqual(expect.any(String))
      expect(validate(null, { siblingData: {} })).toEqual(expect.any(String))
      expect(validate(5, { siblingData: { source: 'center' } })).toBe(true)
    })

    it("leaves the center's library alone when source is shared", () => {
      expect(validateFor('media')(null, { siblingData: { source: 'shared' } })).toBe(true)
    })

    it('requires the shared library only when source is shared', () => {
      const validate = validateFor('sharedMedia')
      expect(validate(null, { siblingData: { source: 'shared' } })).toEqual(expect.any(String))
      expect(validate(5, { siblingData: { source: 'shared' } })).toBe(true)
      expect(validate(null, { siblingData: { source: 'center' } })).toBe(true)
      expect(validate(null, { siblingData: {} })).toBe(true)
    })
  })

  describe('visibility', () => {
    it('shows one upload field at a time', () => {
      const center = conditionFor('media')
      const shared = conditionFor('sharedMedia')

      expect(center({}, { source: 'center' })).toBe(true)
      expect(shared({}, { source: 'center' })).toBe(false)
      expect(center({}, { source: 'shared' })).toBe(false)
      expect(shared({}, { source: 'shared' })).toBe(true)
    })

    it("shows the center's library when a slot predates the source choice", () => {
      expect(conditionFor('media')({}, {})).toBe(true)
    })
  })

  it('takes slot-specific names for blocks with more than one image', () => {
    const named = mediaSourceFields({
      name: 'image',
      sourceName: 'imageSource',
      sharedName: 'sharedImage',
    })
    expect(named.map((f) => ('name' in f ? f.name : null))).toEqual([
      'imageSource',
      'image',
      'sharedImage',
    ])
  })
})
