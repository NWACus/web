import { hoursCovered, precipHours } from '@/services/nac/nwacWeatherFormat'

const TZ = 'America/Los_Angeles'

describe('precipHours', () => {
  it('runs 5 to 5 in daylight time', () => {
    expect(precipHours({ kind: 'day', date: '2026-09-14' }, TZ)).toBe('5 am–5 pm PDT')
    expect(precipHours({ kind: 'night', date: '2026-09-14' }, TZ)).toBe('5 pm–5 am PDT')
  })

  it('runs 4 to 4 in standard time', () => {
    expect(precipHours({ kind: 'day', date: '2026-11-14' }, TZ)).toBe('4 am–4 pm PST')
    expect(precipHours({ kind: 'night', date: '2026-11-14' }, TZ)).toBe('4 pm–4 am PST')
  })
})

describe('hoursCovered', () => {
  it('counts 12 hours a period', () => {
    expect(hoursCovered([{}, {}, {}])).toBe('36 hrs')
  })

  it('is null with no periods', () => {
    expect(hoursCovered([])).toBeNull()
  })
})
