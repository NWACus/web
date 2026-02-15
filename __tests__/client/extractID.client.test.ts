import { extractID } from '@/utilities/extractID'

describe('extractID', () => {
  it('extracts id from an object with an id property', () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const obj = { id: 42 } as Parameters<typeof extractID>[0]
    expect(extractID(obj)).toBe(42)
  })

  it('returns the value directly when given a number', () => {
    expect(extractID(42)).toBe(42)
  })
})
