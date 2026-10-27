import getTextColorFromBgColor from '@/utilities/getTextColorFromBgColor'

describe('getTextColorFromBgColor', () => {
  it('maps a brand shade to its foreground', () => {
    expect(getTextColorFromBgColor('brand-500')).toBe('text-brand-foreground-500')
  })

  it('uses the page foreground on white and nothing on transparent', () => {
    expect(getTextColorFromBgColor('white')).toBe('text-foreground')
    expect(getTextColorFromBgColor('transparent')).toBe('')
  })
})
