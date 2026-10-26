import { hasBackgroundColor } from '@/components/BackgroundColorWrapper'

describe('hasBackgroundColor', () => {
  it('is true for any color but transparent', () => {
    expect(hasBackgroundColor('brand-200')).toBe(true)
    expect(hasBackgroundColor('white')).toBe(true)
    expect(hasBackgroundColor('transparent')).toBe(false)
    expect(hasBackgroundColor(undefined)).toBe(false)
    expect(hasBackgroundColor('')).toBe(false)
  })
})
