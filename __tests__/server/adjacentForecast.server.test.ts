import {
  adjacentSearchWindows,
  findAdjacentDate,
  findCoveringDateBeforeWindow,
  isWithinCalendar,
  latestValidDate,
  nearestDate,
  parseAdjacentQuery,
  type MonthWindow,
} from '@/services/nac/adjacentForecast'

describe('parseAdjacentQuery', () => {
  it('accepts a zone, a real date and a direction', () => {
    expect(parseAdjacentQuery('olympics', '2026-01-05', 'older')).toEqual({
      zoneSlug: 'olympics',
      date: '2026-01-05',
      direction: 'older',
    })
  })

  it.each([
    ['a missing zone', null, '2026-01-05', 'older'],
    ['a malformed date', 'olympics', '2026-13-45', 'older'],
    ['an unknown direction', 'olympics', '2026-01-05', 'sideways'],
    ['a missing direction', 'olympics', '2026-01-05', null],
  ])('rejects %s', (_label, zone, date, dir) => {
    expect(parseAdjacentQuery(zone, date, dir)).toBeNull()
  })
})

describe('adjacentSearchWindows', () => {
  it('walks back month by month to the calendar start, nearest first', () => {
    expect(adjacentSearchWindows('2019-11-14', 'older', '2019-09-01')).toEqual([
      { from: '2019-11-01', to: '2019-11-30' },
      { from: '2019-10-01', to: '2019-10-31' },
      { from: '2019-09-01', to: '2019-09-30' },
    ])
  })

  it('walks forward to the bound’s month', () => {
    expect(adjacentSearchWindows('2026-01-30', 'newer', '2026-03-02')).toEqual([
      { from: '2026-01-01', to: '2026-01-31' },
      { from: '2026-02-01', to: '2026-02-28' },
      { from: '2026-03-01', to: '2026-03-31' },
    ])
  })

  it('has nothing to search before the calendar start', () => {
    expect(adjacentSearchWindows('2019-08-14', 'older', '2019-09-01')).toEqual([])
  })
})

describe('nearestDate', () => {
  const april = { from: '2026-04-01', to: '2026-04-30' }

  it('picks the closest date in the direction asked', () => {
    const dates = ['2026-04-02', '2026-04-05', '2026-04-09', '2026-04-12']
    expect(nearestDate(dates, '2026-04-09', 'older', april)).toBe('2026-04-05')
    expect(nearestDate(dates, '2026-04-09', 'newer', april)).toBe('2026-04-12')
  })

  it('ignores dates outside the window it asked for', () => {
    expect(nearestDate(['2026-03-31', '2026-05-01'], '2026-04-15', 'older', april)).toBeNull()
    expect(nearestDate(['2026-03-31', '2026-05-01'], '2026-04-15', 'newer', april)).toBeNull()
  })
})

describe('isWithinCalendar', () => {
  it('accepts both ends and the days between', () => {
    expect(isWithinCalendar('2019-09-01', '2019-09-01', '2026-10-08')).toBe(true)
    expect(isWithinCalendar('2026-10-08', '2019-09-01', '2026-10-08')).toBe(true)
    expect(isWithinCalendar('2024-01-05', '2019-09-01', '2026-10-08')).toBe(true)
  })

  it('refuses a date before the calendar start or after tomorrow', () => {
    expect(isWithinCalendar('2019-08-31', '2019-09-01', '2026-10-08')).toBe(false)
    expect(isWithinCalendar('2026-10-09', '2019-09-01', '2026-10-08')).toBe(false)
    expect(isWithinCalendar('1900-01-01', '2019-09-01', '2026-10-08')).toBe(false)
    expect(isWithinCalendar('2090-01-01', '2019-09-01', '2026-10-08')).toBe(false)
  })
})

describe('latestValidDate', () => {
  it('is tomorrow, for a forecast published this evening', () => {
    expect(latestValidDate(new Date(2026, 0, 31, 20))).toBe('2026-02-01')
  })
})

describe('findAdjacentDate', () => {
  /** A fake archive: every date, served by whichever month window covers it. */
  function archive(dates: string[]) {
    return jest.fn(async (window: MonthWindow) =>
      dates.filter((d) => d >= window.from && d <= window.to),
    )
  }

  it('steps across an off-season gap to last season’s final forecast', async () => {
    const fetchDates = archive(['2025-04-20', '2025-04-21', '2025-11-28'])

    const older = await findAdjacentDate({
      date: '2025-11-28',
      direction: 'older',
      bound: '2019-09-01',
      fetchDates,
    })

    expect(older).toBe('2025-04-21')
    // Two rounds of six months reach back from November to April; no further.
    expect(fetchDates).toHaveBeenCalledTimes(12)
  })

  it('finds the next season’s first forecast going newer', async () => {
    const newer = await findAdjacentDate({
      date: '2025-04-21',
      direction: 'newer',
      bound: '2026-02-01',
      fetchDates: archive(['2025-04-21', '2025-11-28', '2025-11-30']),
    })

    expect(newer).toBe('2025-11-28')
  })

  it('answers null once the bound is reached with nothing found', async () => {
    const fetchDates = archive(['2020-01-10'])

    await expect(
      findAdjacentDate({ date: '2020-01-10', direction: 'older', bound: '2019-09-01', fetchDates }),
    ).resolves.toBeNull()
    expect(fetchDates).toHaveBeenCalledTimes(5)
  })

  it('rejects when a month cannot be read, rather than reporting none', async () => {
    await expect(
      findAdjacentDate({
        date: '2026-01-10',
        direction: 'older',
        bound: '2019-09-01',
        fetchDates: async () => {
          throw new Error('NAC down')
        },
      }),
    ).rejects.toThrow('NAC down')
  })
})

describe('findCoveringDateBeforeWindow', () => {
  const PACIFIC = 'America/Los_Angeles'
  const entry = (date: string, expiresTime: string | null) => ({
    date,
    productId: Number(date.replaceAll('-', '')),
    productType: 'summary',
    dangerRating: -1,
    dangerLevelText: null,
    danger: null,
    expiresTime,
  })
  /** A fake archive serving each entry from whichever month window holds its date. */
  function archive(entries: ReturnType<typeof entry>[]) {
    return jest.fn(async (window: MonthWindow) =>
      entries.filter((e) => e.date >= window.from && e.date <= window.to),
    )
  }

  // stevens-pass: the 2026-09-15 summary runs to 2026-11-21, past the 11-10 page's Oct–Nov window.
  const summary = entry('2026-09-15', '2026-11-21T02:30:00+00:00')

  it('finds a summary published before the window that still covers the day', async () => {
    await expect(
      findCoveringDateBeforeWindow({
        date: '2026-11-10',
        windowStart: '2026-10-01',
        calendarStart: '2019-09-01',
        timezone: PACIFIC,
        fetchEntries: archive([entry('2026-04-20', '2026-04-21T02:30:00+00:00'), summary]),
      }),
    ).resolves.toBe('2026-09-15')
  })

  it('finds nothing once that summary has expired', async () => {
    await expect(
      findCoveringDateBeforeWindow({
        date: '2026-11-22',
        windowStart: '2026-10-01',
        calendarStart: '2019-09-01',
        timezone: PACIFIC,
        fetchEntries: archive([summary]),
      }),
    ).resolves.toBeNull()
  })

  it('looks only at the nearest older product, not one it superseded', async () => {
    const longer = entry('2026-08-01', '2026-12-31T00:00:00+00:00')
    const nearest = entry('2026-09-15', '2026-09-16T02:30:00+00:00')
    await expect(
      findCoveringDateBeforeWindow({
        date: '2026-11-10',
        windowStart: '2026-10-01',
        calendarStart: '2019-09-01',
        timezone: PACIFIC,
        fetchEntries: archive([longer, nearest]),
      }),
    ).resolves.toBeNull()
  })

  it('finds nothing when no product precedes the window', async () => {
    await expect(
      findCoveringDateBeforeWindow({
        date: '2019-11-10',
        windowStart: '2019-10-01',
        calendarStart: '2019-09-01',
        timezone: PACIFIC,
        fetchEntries: archive([]),
      }),
    ).resolves.toBeNull()
  })
})
