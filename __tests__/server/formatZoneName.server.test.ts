import { formatZoneName } from '@/utilities/formatZoneName'

describe('formatZoneName', () => {
  it('title-cases a hyphenated slug', () => {
    expect(formatZoneName('stevens-pass')).toBe('Stevens Pass')
  })

  it('handles multi-word slugs', () => {
    expect(formatZoneName('west-slopes-north')).toBe('West Slopes North')
  })

  it('handles a single-word slug', () => {
    expect(formatZoneName('olympics')).toBe('Olympics')
  })
})
