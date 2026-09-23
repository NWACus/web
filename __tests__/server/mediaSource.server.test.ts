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
  options: ReturnType<typeof validateOptions>,
) => Promise<string | true> | string | true

type SlotHook = (args: { siblingData: Record<string, unknown>; value: unknown }) => unknown

// Enough of Payload's validate options for its default `upload` check to run on a numeric id.
// 'onChange' stops it before the filterOptions lookup, which would need a database.
function validateOptions(siblingData: Record<string, unknown>) {
  return {
    siblingData,
    event: 'onChange',
    relationTo: 'media',
    req: { payload: { collections: {}, db: { defaultIDType: 'number' } }, t: String },
  }
}

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

function beforeValidateFor(name: string): SlotHook {
  const hook = uploadFieldNamed(name).hooks?.beforeValidate?.[0]
  if (!hook) throw new Error(`Upload field ${name} has no beforeValidate hook`)
  // @ts-expect-error - Payload types field hooks for its own call sites, which pass far more than this
  return hook
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
    it("requires the center's library when source is center or absent", async () => {
      const validate = validateFor('media')
      expect(validate(null, validateOptions({ source: 'center' }))).toEqual(expect.any(String))
      expect(validate(null, validateOptions({}))).toEqual(expect.any(String))
      await expect(validate(5, validateOptions({ source: 'center' }))).resolves.toBe(true)
    })

    it("leaves the center's library alone when source is shared", () => {
      expect(validateFor('media')(null, validateOptions({ source: 'shared' }))).toBe(true)
    })

    it('requires the shared library only when source is shared', async () => {
      const validate = validateFor('sharedMedia')
      expect(validate(null, validateOptions({ source: 'shared' }))).toEqual(expect.any(String))
      await expect(validate(5, validateOptions({ source: 'shared' }))).resolves.toBe(true)
      expect(validate(null, validateOptions({ source: 'center' }))).toBe(true)
      expect(validate(null, validateOptions({}))).toBe(true)
    })

    it("keeps Payload's own check on the selected id", async () => {
      await expect(
        validateFor('sharedMedia')(
          // @ts-expect-error - a malformed id, the case Payload's default validator rejects
          'not-an-id',
          validateOptions({ source: 'shared' }),
        ),
      ).resolves.toEqual(expect.stringContaining('invalid'))
    })
  })

  describe('the hidden half', () => {
    it('is cleared on save, so a photo the slot no longer shows is not recorded as used', () => {
      expect(
        beforeValidateFor('sharedMedia')({ siblingData: { source: 'center' }, value: 9 }),
      ).toBe(null)
      expect(beforeValidateFor('sharedMedia')({ siblingData: {}, value: 9 })).toBe(null)
      expect(beforeValidateFor('media')({ siblingData: { source: 'shared' }, value: 5 })).toBe(null)
    })

    it('keeps the selected half', () => {
      expect(
        beforeValidateFor('sharedMedia')({ siblingData: { source: 'shared' }, value: 9 }),
      ).toBe(9)
      expect(beforeValidateFor('media')({ siblingData: { source: 'center' }, value: 5 })).toBe(5)
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
