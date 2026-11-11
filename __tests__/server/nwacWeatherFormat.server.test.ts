import { dayRange, precipHours, tempScale } from '@/services/nac/nwacWeatherFormat'

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

describe('tempScale', () => {
  it('spans the lowest low to the highest high, a degree either side', () => {
    expect(
      tempScale([
        { high: 37, low: 22 },
        { high: 41, low: 18 },
        undefined,
        { high: null, low: null },
      ]),
    ).toEqual({ min: 17, max: 42 })
  })

  it('is null with no temperatures', () => {
    expect(tempScale([undefined, { high: null, low: null }])).toBeNull()
  })
})

describe('dayRange', () => {
  it('names the first and last periods the run spans', () => {
    expect(
      dayRange([
        { date: '2026-10-15', kind: 'night' },
        { date: '2026-10-16', kind: 'day' },
        { date: '2026-10-17', kind: 'day' },
      ]),
    ).toBe('Thu Night – Sat Day')
  })

  it('names one period alone', () => {
    expect(dayRange([{ date: '2026-10-15', kind: 'day' }])).toBe('Thu Day')
  })

  it('is null with no periods', () => {
    expect(dayRange([])).toBeNull()
  })
})
