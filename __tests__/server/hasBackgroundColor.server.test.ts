import { hasBackgroundColor } from '@/utilities/hasBackgroundColor'

describe('hasBackgroundColor', () => {
  it('is true only for a brand shade', () => {
    expect(hasBackgroundColor('brand-200')).toBe(true)
    expect(hasBackgroundColor('white')).toBe(false)
    expect(hasBackgroundColor('transparent')).toBe(false)
    expect(hasBackgroundColor(undefined)).toBe(false)
    expect(hasBackgroundColor('')).toBe(false)
  })
})
