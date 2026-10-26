import { isGlossaryEnabled } from '@/services/glossary/glossaryEnabled'

describe('isGlossaryEnabled', () => {
  it('follows the AFP forecast widget flag, off when the forecast block is absent', () => {
    const forecast = { color: '', elevInfoUrl: '', tabs: [] }
    expect(
      isGlossaryEnabled({ widget_config: { forecast: { ...forecast, glossary: true } } }),
    ).toBe(true)
    expect(
      isGlossaryEnabled({ widget_config: { forecast: { ...forecast, glossary: false } } }),
    ).toBe(false)
    expect(isGlossaryEnabled({ widget_config: {} })).toBe(false)
  })
})
