import { observationsWidgetPath } from '@/blocks/ObservationsWidget/widgetPath'

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
