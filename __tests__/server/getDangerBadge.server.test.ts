import { getDangerBadge } from '@/app/api/[center]/og/getDangerBadge'
import type { ZoneProperties } from '@/services/nac/model/mapLayer'

const danger = (overrides: Partial<ZoneProperties>): ZoneProperties => ({
  name: 'Stevens Pass',
  center: null,
  center_link: null,
  timezone: null,
  center_id: 'NWAC',
  state: null,
  off_season: false,
  danger: null,
  danger_level: 0,
  travel_advice: null,
  color: null,
  stroke: null,
  font_color: null,
  link: null,
  start_date: null,
  end_date: null,
  warning: { product: null },
  ...overrides,
})

describe('getDangerBadge', () => {
  it('builds a rated badge for levels 1-5', () => {
    const badge = getDangerBadge(
      danger({
        danger_level: 3,
        danger: 'considerable',
        color: '#F7941E',
        font_color: '#ffffff',
        travel_advice: 'Be careful.',
      }),
    )
    expect(badge).toEqual({
      level: '3',
      label: 'Considerable',
      background: '#F7941E',
      foreground: '#ffffff',
      travelAdvice: 'Be careful.',
      iconFile: '3.png',
    })
  })

  it('uses the no-rating icon and label for off-season (danger_level -1)', () => {
    const badge = getDangerBadge(danger({ danger_level: -1, danger: 'no rating' }))
    expect(badge.level).toBeNull()
    expect(badge.label).toBe('No Rating')
    expect(badge.iconFile).toBe('no-rating.png')
  })

  it('treats danger_level 0 as no rating', () => {
    const badge = getDangerBadge(danger({ danger_level: 0 }))
    expect(badge.level).toBeNull()
    expect(badge.iconFile).toBe('no-rating.png')
  })

  it('falls back to the no-rating icon for an out-of-range level (never a missing N.png)', () => {
    const badge = getDangerBadge(danger({ danger_level: 6 }))
    expect(badge.level).toBeNull()
    expect(badge.iconFile).toBe('no-rating.png')
  })

  it('defaults color and foreground when the API omits them', () => {
    const badge = getDangerBadge(danger({ danger_level: 2, color: null, font_color: null }))
    expect(badge.background).toBe('#888888')
    expect(badge.foreground).toBe('#ffffff')
  })
})
