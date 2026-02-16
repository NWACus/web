// Mock payload/shared which uses ESM and can't be parsed by Jest
jest.mock('payload/shared', () => ({ text: jest.fn(() => true) }))

import { phoneSchema } from '@/utilities/validatePhone'

describe('phoneSchema', () => {
  it('accepts (123) 456-7890', () => {
    expect(() => phoneSchema.parse('(123) 456-7890')).not.toThrow()
  })

  it('accepts 123-456-7890', () => {
    expect(() => phoneSchema.parse('123-456-7890')).not.toThrow()
  })

  it('accepts 123.456.7890', () => {
    expect(() => phoneSchema.parse('123.456.7890')).not.toThrow()
  })

  it('accepts 1234567890', () => {
    expect(() => phoneSchema.parse('1234567890')).not.toThrow()
  })

  it('accepts +1 123 456 7890', () => {
    expect(() => phoneSchema.parse('+1 123 456 7890')).not.toThrow()
  })

  it('accepts 1-123-456-7890', () => {
    expect(() => phoneSchema.parse('1-123-456-7890')).not.toThrow()
  })

  it('rejects too few digits', () => {
    expect(() => phoneSchema.parse('123-456')).toThrow()
  })

  it('rejects too many digits', () => {
    expect(() => phoneSchema.parse('12345678901234')).toThrow()
  })

  it('rejects letters', () => {
    expect(() => phoneSchema.parse('abc-def-ghij')).toThrow()
  })

  it('rejects empty string', () => {
    expect(() => phoneSchema.parse('')).toThrow()
  })
})
