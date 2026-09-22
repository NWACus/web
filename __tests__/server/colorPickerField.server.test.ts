import { BACKGROUND_COLOR_OPTIONS, validateBackgroundColor } from '@/fields/color'

describe('validateBackgroundColor', () => {
  it('accepts every palette value', () => {
    for (const color of BACKGROUND_COLOR_OPTIONS) {
      expect(validateBackgroundColor(color)).toBe(true)
    }
  })

  it('rejects values outside the palette', () => {
    expect(validateBackgroundColor('background_color')).toMatch(/palette/)
    expect(validateBackgroundColor('gray')).toMatch(/palette/)
    expect(validateBackgroundColor(undefined)).toMatch(/palette/)
  })
})
