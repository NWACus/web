import { extractID } from '@/utilities/extractID'
import { buildBuiltInPage } from '../../builders'

describe('extractID', () => {
  it('extracts id from an object with an id property', () => {
    expect(extractID(buildBuiltInPage({ id: 42 }))).toBe(42)
  })

  it('returns the value directly when given a number', () => {
    expect(extractID(42)).toBe(42)
  })
})
