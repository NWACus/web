import { BLOCK_PADDING, blockSpacing } from '@/components/BackgroundColorWrapper'
import { hasBackgroundColor } from '@/fields/color'

describe('hasBackgroundColor', () => {
  it('is true for any palette color but transparent', () => {
    expect(hasBackgroundColor('brand-200')).toBe(true)
    expect(hasBackgroundColor('white')).toBe(true)
    expect(hasBackgroundColor('transparent')).toBe(false)
    expect(hasBackgroundColor('gray')).toBe(false)
    expect(hasBackgroundColor(undefined)).toBe(false)
    expect(hasBackgroundColor('')).toBe(false)
  })
})

describe('blockSpacing', () => {
  it('gives a plain block nothing', () => {
    expect(blockSpacing('transparent')).toEqual({ inner: false, bg: false })
  })

  it('gives a colored block padding and its color', () => {
    expect(blockSpacing('brand-300')).toEqual({ inner: BLOCK_PADDING, bg: 'bg-brand-300' })
    expect(blockSpacing('white').bg).toBe('bg-white')
  })

  it('treats an off-palette value as no background', () => {
    expect(blockSpacing('gray')).toEqual({ inner: false, bg: false })
  })
})
