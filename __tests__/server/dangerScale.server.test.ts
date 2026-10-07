import { dangerColor, dangerIconUrl, dangerName, dangerTextColor } from '@/services/nac/dangerScale'
import { DangerLevel } from '@/services/nac/types/forecastSchemas'

describe('dangerName', () => {
  it.each([
    [DangerLevel.Extreme, 'Extreme'],
    [DangerLevel.High, 'High'],
    [DangerLevel.Considerable, 'Considerable'],
    [DangerLevel.Moderate, 'Moderate'],
    [DangerLevel.Low, 'Low'],
    [DangerLevel.None, 'No Rating'],
    [DangerLevel.GeneralInformation, 'No Rating'],
  ])('returns "%s" for level %i', (level, expected) => {
    expect(dangerName(level)).toBe(expected)
  })
})

describe('dangerColor', () => {
  it.each([
    [DangerLevel.Extreme, '#231f20'],
    [DangerLevel.High, '#ed1c24'],
    [DangerLevel.Considerable, '#f7941e'],
    [DangerLevel.Moderate, '#fff200'],
    [DangerLevel.Low, '#50b848'],
    [DangerLevel.None, '#939598'],
    [DangerLevel.GeneralInformation, '#6ea4db'],
  ])('returns correct hex for level %i', (level, expected) => {
    expect(dangerColor(level)).toBe(expected)
  })
})

describe('dangerTextColor', () => {
  it.each([
    [DangerLevel.Extreme, '#ffffff'],
    [DangerLevel.High, '#1a1a1a'],
    [DangerLevel.Considerable, '#1a1a1a'],
    [DangerLevel.Moderate, '#1a1a1a'],
    [DangerLevel.Low, '#1a1a1a'],
    [DangerLevel.None, '#1a1a1a'],
    [DangerLevel.GeneralInformation, '#1a1a1a'],
  ])('returns appropriate contrast color for level %i', (level, expected) => {
    expect(dangerTextColor(level)).toBe(expected)
  })
})

describe('dangerIconUrl', () => {
  it.each([
    [DangerLevel.Extreme, '/images/danger-icons/5.png'],
    [DangerLevel.High, '/images/danger-icons/4.png'],
    [DangerLevel.Considerable, '/images/danger-icons/3.png'],
    [DangerLevel.Moderate, '/images/danger-icons/2.png'],
    [DangerLevel.Low, '/images/danger-icons/1.png'],
    [DangerLevel.None, '/images/danger-icons/0.png'],
    [DangerLevel.GeneralInformation, '/images/danger-icons/0.png'],
  ])('returns correct path for level %i', (level, expected) => {
    expect(dangerIconUrl(level)).toBe(expected)
  })
})
