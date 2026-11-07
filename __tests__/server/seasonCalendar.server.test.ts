import {
  sameMonthInSeason,
  seasonBounds,
  seasonName,
  seasonOfMonth,
  seasonsSince,
} from '../../src/components/seasonCalendar'

describe('seasonName', () => {
  it('shortens the end year', () => {
    expect(seasonName(2026)).toBe('2025–26')
  })
})

describe('seasonsSince', () => {
  it('lists newest first, back to the first season', () => {
    expect(seasonsSince(2025, '2026-11-05')).toEqual([2027, 2026, 2025])
  })
})

describe('seasonBounds', () => {
  it('runs Sep 1 to Aug 31 for a finished season', () => {
    expect(seasonBounds(2026, '2026-11-05')).toEqual({ from: '2025-09-01', to: '2026-08-31' })
  })

  it('stops at today in the current season', () => {
    expect(seasonBounds(2027, '2026-11-05')).toEqual({ from: '2026-09-01', to: '2026-11-05' })
  })
})

describe('seasonOfMonth', () => {
  it('reads September as the start of the next season', () => {
    expect(seasonOfMonth(new Date(2026, 8, 1))).toBe(2027)
    expect(seasonOfMonth(new Date(2026, 7, 31))).toBe(2026)
  })
})

describe('sameMonthInSeason', () => {
  const today = new Date(2026, 10, 5)

  it('keeps the month in another season', () => {
    expect(sameMonthInSeason(new Date(2026, 10, 1), 2024, today)).toEqual(new Date(2023, 10, 1))
    expect(sameMonthInSeason(new Date(2026, 0, 1), 2024, today)).toEqual(new Date(2024, 0, 1))
  })

  it('falls back to the latest started month for a future one', () => {
    expect(sameMonthInSeason(new Date(2026, 0, 1), 2027, today)).toEqual(new Date(2026, 10, 1))
  })
})
