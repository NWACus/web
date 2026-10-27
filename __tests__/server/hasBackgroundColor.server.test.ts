import {
  BLOCK_MARGIN,
  BLOCK_PADDING,
  blockSpacing,
  hasBackgroundColor,
} from '@/components/BackgroundColorWrapper'

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
  it('gives a plain layout block margin only', () => {
    expect(blockSpacing('transparent', true)).toEqual({
      outer: BLOCK_MARGIN,
      inner: false,
      bg: false,
    })
  })

  it('gives a colored layout block padding and its color, no margin', () => {
    expect(blockSpacing('brand-300', true)).toEqual({
      outer: false,
      inner: BLOCK_PADDING,
      bg: 'bg-brand-300',
    })
    expect(blockSpacing('white', true).bg).toBe('bg-white')
  })

  it('never gives an inline block margin', () => {
    expect(blockSpacing('transparent', false).outer).toBe(false)
    expect(blockSpacing('brand-300', false).outer).toBe(false)
  })

  it('treats an off-palette value as no background', () => {
    expect(blockSpacing('gray', true)).toEqual({ outer: BLOCK_MARGIN, inner: false, bg: false })
  })
})
