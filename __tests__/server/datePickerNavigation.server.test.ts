import {
  adjacentForecastHrefs,
  dayKey,
  fetchAdjacentDate,
  fetchArchiveMonth,
  forecastArrowPlan,
  forecastHref,
  lookupOutcome,
  mergeDays,
  monthKey,
  monthsBetween,
  triggerLabel,
} from '@/components/forecast/datePickerNavigation'

describe('forecastArrowPlan', () => {
  const basePath = '/forecasts/avalanche/west-slopes-north'
  const plan = (overrides: Partial<Parameters<typeof forecastArrowPlan>[0]>) =>
    forecastArrowPlan({
      loadedDates: ['2025-11-28', '2025-12-01'],
      loadedMonths: new Set(['2025-11', '2025-12']),
      shownDate: '2025-11-28',
      currentDate: '2026-02-09',
      basePath,
      calendarStart: '2019-09-01',
      latest: '2026-02-10',
      ...overrides,
    })

  it('links a loaded neighbour and leaves the lookup off that way', () => {
    expect(plan({})).toMatchObject({ newerHref: `${basePath}/2025-12-01`, lookNewer: false })
  })

  it('looks older up when unloaded months remain before the season’s first forecast', () => {
    // The season's first forecast: last season's last one is months back, outside the window.
    expect(plan({})).toMatchObject({ olderHref: undefined, lookOlder: true })
  })

  it('disables older once every month back to the calendar start is loaded', () => {
    expect(plan({ calendarStart: '2025-11-01' })).toMatchObject({
      olderHref: undefined,
      lookOlder: false,
    })
  })

  it('looks newer up past the loaded months on a dated page', () => {
    expect(plan({ shownDate: '2025-12-01' })).toMatchObject({
      newerHref: undefined,
      lookNewer: true,
    })
  })

  it('never offers newer on the live page', () => {
    const live = plan({
      loadedDates: ['2026-02-09'],
      loadedMonths: new Set(['2026-01', '2026-02']),
      shownDate: '2026-02-09',
    })
    expect(live).toMatchObject({ newerHref: undefined, lookNewer: false })
  })

  it('has nothing to offer with nothing shown', () => {
    expect(plan({ shownDate: null })).toMatchObject({ lookOlder: false, lookNewer: false })
  })
})

describe('lookupOutcome', () => {
  const basePath = '/forecasts/avalanche/olympics'

  it('links a found date, the current product’s at the live page', () => {
    expect(lookupOutcome({ date: '2025-04-21' }, 'older', '2025-11-28', null, basePath)).toEqual({
      href: `${basePath}/2025-04-21`,
    })
    expect(
      lookupOutcome({ date: '2026-02-09' }, 'newer', '2026-01-02', '2026-02-09', basePath),
    ).toEqual({ href: basePath })
  })

  it('reaches the live page going newer when the archive trails a fresh publish', () => {
    expect(lookupOutcome({ date: null }, 'newer', '2026-02-08', '2026-02-09', basePath)).toEqual({
      href: basePath,
    })
  })

  it('reports none, or a failure, otherwise', () => {
    expect(lookupOutcome({ date: null }, 'older', '2019-11-01', '2026-02-09', basePath)).toBe(
      'none',
    )
    expect(lookupOutcome(null, 'older', '2025-11-28', null, basePath)).toBe('failed')
  })
})

describe('fetchAdjacentDate', () => {
  const originalFetch = global.fetch
  afterEach(() => {
    global.fetch = originalFetch
  })

  it('asks for the zone, date and direction, encoding the slug', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ date: null }) })

    await expect(fetchAdjacentDate('snfac', 'banner-&-x', '2026-01-02', 'older')).resolves.toEqual({
      date: null,
    })
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/snfac/forecast-archive/adjacent?zone=banner-%26-x&date=2026-01-02&dir=older',
    )
  })

  it('returns null on a failed request, so the arrow can try again', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false })
    expect(await fetchAdjacentDate('snfac', 'z', '2026-01-02', 'newer')).toBeNull()

    global.fetch = jest.fn().mockRejectedValue(new Error('offline'))
    expect(await fetchAdjacentDate('snfac', 'z', '2026-01-02', 'newer')).toBeNull()
  })
})

describe('dayKey / monthKey', () => {
  it('formats a date as its day and month keys', () => {
    const d = new Date(2026, 1, 9) // 2026-02-09, local
    expect(dayKey(d)).toBe('2026-02-09')
    expect(monthKey(d)).toBe('2026-02')
  })
})

describe('monthsBetween', () => {
  it('includes both endpoints', () => {
    expect(monthsBetween('2025-12-14', '2026-02-03')).toEqual(['2025-12', '2026-01', '2026-02'])
  })

  it('returns a single month when from and to share one', () => {
    expect(monthsBetween('2026-01-02', '2026-01-28')).toEqual(['2026-01'])
  })

  it('returns nothing when the window runs backwards', () => {
    expect(monthsBetween('2026-03-01', '2026-01-01')).toEqual([])
  })

  it('crosses a year boundary', () => {
    expect(monthsBetween('2025-11-01', '2026-01-01')).toEqual(['2025-11', '2025-12', '2026-01'])
  })
})

describe('forecastHref', () => {
  const basePath = '/forecasts/avalanche/west-slopes-north'

  it('links the current product to the live page', () => {
    expect(forecastHref(basePath, '2026-02-09', '2026-02-09')).toBe(basePath)
  })

  it('links any other date to its dated route', () => {
    expect(forecastHref(basePath, '2026-02-09', '2026-02-08')).toBe(`${basePath}/2026-02-08`)
  })

  it('uses the dated route when there is no current product', () => {
    expect(forecastHref(basePath, null, '2026-02-08')).toBe(`${basePath}/2026-02-08`)
  })
})

describe('mergeDays', () => {
  const day = (date: string, dangerRating: number) => ({
    date,
    dangerRating,
    dangerLevelText: null,
    danger: null,
  })

  it('adds fetched days without mutating the previous map', () => {
    const previous = new Map([['2026-02-01', day('2026-02-01', 2)]])
    const next = mergeDays(previous, [day('2026-02-02', 3)])

    expect(next.get('2026-02-01')?.dangerRating).toBe(2)
    expect(next.get('2026-02-02')?.dangerRating).toBe(3)
    expect(previous.has('2026-02-02')).toBe(false)
  })

  it('lets a fetched day overwrite a stale one', () => {
    const next = mergeDays(new Map([['2026-02-01', day('2026-02-01', 2)]]), [day('2026-02-01', 4)])
    expect(next.get('2026-02-01')?.dangerRating).toBe(4)
  })
})

describe('adjacentForecastHrefs', () => {
  const basePath = '/forecasts/avalanche/west-slopes-north'
  const loaded = ['2026-02-07', '2026-02-08', '2026-02-09', '2026-02-10']

  it('steps to the neighbouring loaded dates', () => {
    expect(adjacentForecastHrefs(loaded, '2026-02-09', '2026-02-10', basePath)).toEqual({
      olderHref: `${basePath}/2026-02-08`,
      newerHref: basePath, // 2026-02-10 is the current product
    })
  })

  it('has no newer arrow on the live page', () => {
    expect(
      adjacentForecastHrefs(loaded, '2026-02-10', '2026-02-10', basePath).newerHref,
    ).toBeUndefined()
  })

  it('has no older arrow at the oldest loaded date', () => {
    expect(
      adjacentForecastHrefs(loaded, '2026-02-07', '2026-02-10', basePath).olderHref,
    ).toBeUndefined()
  })

  it('returns neither arrow when nothing is shown', () => {
    expect(adjacentForecastHrefs(loaded, null, '2026-02-10', basePath)).toEqual({
      olderHref: undefined,
      newerHref: undefined,
    })
  })

  it('sorts unordered input before stepping', () => {
    const shuffled = ['2026-02-10', '2026-02-07', '2026-02-09', '2026-02-08']
    expect(adjacentForecastHrefs(shuffled, '2026-02-09', null, basePath)).toEqual({
      olderHref: `${basePath}/2026-02-08`,
      newerHref: `${basePath}/2026-02-10`,
    })
  })

  it('does not mutate the caller’s array', () => {
    const dates = ['2026-02-10', '2026-02-07']
    adjacentForecastHrefs(dates, '2026-02-09', null, basePath)
    expect(dates).toEqual(['2026-02-10', '2026-02-07'])
  })
})

describe('triggerLabel', () => {
  it('formats a selected date', () => {
    expect(triggerLabel('2026-02-09')).toBe('Feb 9, 2026')
  })

  it('names the live page when nothing is selected', () => {
    expect(triggerLabel(null)).toBe('Current forecast')
  })
})

describe('fetchArchiveMonth', () => {
  const originalFetch = global.fetch
  afterEach(() => {
    global.fetch = originalFetch
  })

  it('requests the zone/window and returns the dates', async () => {
    const json = jest.fn().mockResolvedValue({ dates: [{ date: '2026-02-01', dangerRating: 2 }] })
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json })

    const result = await fetchArchiveMonth('nwac', 'west-slopes-north', '2026-02-01', '2026-02-28')

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/nwac/forecast-archive?zone=west-slopes-north&from=2026-02-01&to=2026-02-28',
    )
    expect(result).toEqual([{ date: '2026-02-01', dangerRating: 2 }])
  })

  it('returns an empty list when the body carries no dates', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue({}) })
    expect(await fetchArchiveMonth('nwac', 'zone', '2026-02-01', '2026-02-28')).toEqual([])
  })

  it('returns null on a non-ok response so the month can be retried', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, json: jest.fn() })
    expect(await fetchArchiveMonth('nwac', 'zone', '2026-02-01', '2026-02-28')).toBeNull()
  })

  it('returns null when the request throws', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('offline'))
    expect(await fetchArchiveMonth('nwac', 'zone', '2026-02-01', '2026-02-28')).toBeNull()
  })
})
