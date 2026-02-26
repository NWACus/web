// Mock payload/shared which uses ESM and can't be parsed by Jest
jest.mock('payload/shared', () => ({ text: jest.fn(() => true) }))

import { zipCodeSchema } from '@/utilities/validateZipCode'

describe('zipCodeSchema', () => {
  it('accepts 5-digit ZIP code', () => {
    expect(() => zipCodeSchema.parse('12345')).not.toThrow()
  })

  it('accepts 5+4 format ZIP code', () => {
    expect(() => zipCodeSchema.parse('12345-6789')).not.toThrow()
  })

  it('rejects 4-digit code', () => {
    expect(() => zipCodeSchema.parse('1234')).toThrow()
  })

  it('rejects 6-digit code', () => {
    expect(() => zipCodeSchema.parse('123456')).toThrow()
  })

  it('rejects letters', () => {
    expect(() => zipCodeSchema.parse('abcde')).toThrow()
  })

  it('rejects incomplete 5+4 format', () => {
    expect(() => zipCodeSchema.parse('12345-67')).toThrow()
  })

  it('rejects empty string', () => {
    expect(() => zipCodeSchema.parse('')).toThrow()
  })
})
