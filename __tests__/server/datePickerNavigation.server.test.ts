import {
  adjacentForecastHrefs,
  dayKey,
  fetchArchiveMonth,
  forecastHref,
  mergeRatings,
  monthKey,
  monthsBetween,
  triggerLabel,
} from '@/components/forecast/datePickerNavigation'

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

describe('mergeRatings', () => {
  it('adds fetched ratings without mutating the previous map', () => {
    const previous = new Map([['2026-02-01', 2]])
    const next = mergeRatings(previous, [{ date: '2026-02-02', dangerRating: 3 }])

    expect(next.get('2026-02-01')).toBe(2)
    expect(next.get('2026-02-02')).toBe(3)
    expect(previous.has('2026-02-02')).toBe(false)
  })

  it('lets a fetched rating overwrite a stale one', () => {
    const next = mergeRatings(new Map([['2026-02-01', 2]]), [
      { date: '2026-02-01', dangerRating: 4 },
    ])
    expect(next.get('2026-02-01')).toBe(4)
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
