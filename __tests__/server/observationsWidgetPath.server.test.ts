import {
  dateRangeOptions,
  isValidDateRange,
  observationsWidgetPath,
} from '@/blocks/ObservationsWidget/widgetPath'

// Mid-season, so no range below reaches back past the Sep 1 season start
const JAN_15 = new Date(2026, 0, 15)

function query(path: string): Record<string, string> {
  return Object.fromEntries(new URLSearchParams(path.split('?')[1] ?? ''))
}

describe('observationsWidgetPath', () => {
  it('opens the observations view with no query by default', () => {
    expect(observationsWidgetPath({}, JAN_15)).toBe('/view/observations')
  })

  it('opens the avalanches view', () => {
    expect(observationsWidgetPath({ tab: 'avalanches' }, JAN_15)).toBe('/view/avalanches')
  })

  it('leaves the widget default of the past 2 weeks out of the query', () => {
    expect(observationsWidgetPath({ dateRange: 'past2Weeks' }, JAN_15)).toBe('/view/observations')
  })

  it.each([
    ['pastDay', '2026-01-14'],
    ['past3Days', '2026-01-12'],
    ['pastWeek', '2026-01-08'],
    ['pastMonth', '2025-12-16'],
    ['thisSeason', '2025-09-01'],
  ] as const)('%s starts on %s and ends today', (dateRange, startDate) => {
    expect(query(observationsWidgetPath({ dateRange }, JAN_15))).toEqual({
      startDate,
      endDate: '2026-01-15',
    })
  })

  it('starts no earlier than the season start', () => {
    expect(
      query(observationsWidgetPath({ dateRange: 'pastMonth' }, new Date(2026, 8, 10))),
    ).toEqual({ startDate: '2026-09-01', endDate: '2026-09-10' })
  })

  it('opens a past season from Sep 1 to Aug 31, with the season the widget names by its end year', () => {
    expect(query(observationsWidgetPath({ dateRange: '2023-24' }, JAN_15))).toEqual({
      season: '2024',
      startDate: '2023-09-01',
      endDate: '2024-08-31',
    })
  })

  it('falls back to the widget default for a date range it does not recognize', () => {
    expect(observationsWidgetPath({ dateRange: '2023-25' }, JAN_15)).toBe('/view/observations')
  })

  it('serializes zones as a JSON array of names', () => {
    const path = observationsWidgetPath({ zones: ['Mt Hood', 'Olympics'] }, JAN_15)
    expect(query(path)).toEqual({ zone: '["Mt Hood","Olympics"]' })
  })

  it('filters observations to ones reporting avalanches', () => {
    expect(query(observationsWidgetPath({ avalanchesObservedOnly: true }, JAN_15))).toEqual({
      avalancheObs: 'true',
    })
  })

  it('ignores the avalanches-observed filter on the avalanches view', () => {
    expect(
      observationsWidgetPath({ tab: 'avalanches', avalanchesObservedOnly: true }, JAN_15),
    ).toBe('/view/avalanches')
  })

  it('combines filters', () => {
    const path = observationsWidgetPath(
      { tab: 'avalanches', dateRange: 'pastWeek', zones: ['Stevens Pass'] },
      JAN_15,
    )
    expect(path.split('?')[0]).toBe('/view/avalanches')
    expect(query(path)).toEqual({
      zone: '["Stevens Pass"]',
      startDate: '2026-01-08',
      endDate: '2026-01-15',
    })
  })
})

describe('dateRangeOptions', () => {
  it('lists the presets, with this season’s years, then past seasons back to the first', () => {
    expect(dateRangeOptions(JAN_15, 2023, 'pastWeek')).toEqual([
      { value: 'pastDay', label: 'Past Day' },
      { value: 'past3Days', label: 'Past 3 Days' },
      { value: 'pastWeek', label: 'Past Week' },
      { value: 'past2Weeks', label: 'Past 2 Weeks' },
      { value: 'pastMonth', label: 'Past Month' },
      { value: 'thisSeason', label: 'This Season (25/26)' },
      { value: '2024-25', label: '24/25 Season' },
      { value: '2023-24', label: '23/24 Season' },
      { value: '2022-23', label: '22/23 Season' },
    ])
  })

  it('rolls over to a new season on Sep 1', () => {
    const options = dateRangeOptions(new Date(2026, 8, 1), 2026, 'pastWeek')
    expect(options.slice(-2)).toEqual([
      { value: 'thisSeason', label: 'This Season (26/27)' },
      { value: '2025-26', label: '25/26 Season' },
    ])
  })

  it('keeps a saved season the widget no longer offers, flagged', () => {
    expect(dateRangeOptions(JAN_15, 2025, '2019-20').at(-1)).toEqual({
      value: '2019-20',
      label: '19/20 Season (not offered by the widget)',
    })
  })

  it('offers the presets and the saved season until past seasons load', () => {
    expect(dateRangeOptions(JAN_15, null, '2019-20').slice(-2)).toEqual([
      { value: 'thisSeason', label: 'This Season (25/26)' },
      { value: '2019-20', label: '19/20 Season' },
    ])
  })

  it('offers only the presets until past seasons load', () => {
    expect(dateRangeOptions(JAN_15, null, 'pastWeek').map((option) => option.value)).toEqual([
      'pastDay',
      'past3Days',
      'pastWeek',
      'past2Weeks',
      'pastMonth',
      'thisSeason',
    ])
  })
})

describe('isValidDateRange', () => {
  it.each(['pastWeek', 'thisSeason', '2024-25', '1999-00'])('accepts %s', (value) => {
    expect(isValidDateRange(value, JAN_15)).toBe(true)
  })

  it.each(['', 'lastYear', '2025-26', '2026-27', '2023-25', '24/25'])('rejects %s', (value) => {
    expect(isValidDateRange(value, JAN_15)).toBe(false)
  })
})
