import { validateSlug } from '@/utilities/validateSlug'

// validateSlug is a Payload field validator - it takes (value, args) but
// we only need to test the value parameter for format validation
const validate = (value: string | null | undefined) =>
  validateSlug(value, {} as Parameters<typeof validateSlug>[1])

describe('validateSlug', () => {
  it('accepts a simple slug', () => {
    expect(validate('hello')).toBe(true)
  })

  it('accepts a kebab-case slug', () => {
    expect(validate('hello-world')).toBe(true)
  })

  it('accepts a slug with numbers', () => {
    expect(validate('post-123')).toBe(true)
  })

  it('accepts a single number', () => {
    expect(validate('123')).toBe(true)
  })

  it('accepts a slug with multiple hyphens between words', () => {
    expect(validate('a-b-c-d')).toBe(true)
  })

  it('rejects null', () => {
    expect(validate(null)).toBe('Slug must not be blank')
  })

  it('rejects undefined', () => {
    expect(validate(undefined)).toBe('Slug must not be blank')
  })

  it('rejects slugs containing slashes', () => {
    expect(validate('hello/world')).toBe('Slug cannot contain /')
  })

  it('rejects slugs starting with a hyphen', () => {
    expect(validate('-hello')).toBe('Invalid slug: must be letters, numbers, or -')
  })

  it('rejects slugs ending with a hyphen', () => {
    expect(validate('hello-')).toBe('Invalid slug: must be letters, numbers, or -')
  })

  it('rejects slugs with spaces', () => {
    expect(validate('hello world')).toBe('Invalid slug: must be letters, numbers, or -')
  })

  it('rejects slugs with special characters', () => {
    expect(validate('hello_world')).toBe('Invalid slug: must be letters, numbers, or -')
  })
})
