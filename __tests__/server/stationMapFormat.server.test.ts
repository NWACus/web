import {
  formatObservedAt,
  minutesSince,
  normalizeSource,
  orderVariables,
  shortUnit,
  sourceColor,
  sourceLabel,
  variableDisplayName,
  windArrowRotation,
  windDirectionLabel,
} from '@/services/snowobs/stationMap/format'

describe('windDirectionLabel', () => {
  it.each([
    [0, 'N'],
    [11, 'N'],
    [12, 'NNE'],
    [45, 'NE'],
    [90, 'E'],
    [135, 'SE'],
    [180, 'S'],
    [225, 'SW'],
    [270, 'W'],
    [315, 'NW'],
    [348, 'NNW'],
    [349, 'N'],
    [360, 'N'],
  ])('%d° is %s', (degrees, label) => {
    expect(windDirectionLabel(degrees)).toBe(label)
  })

  it('has no label for a missing reading', () => {
    expect(windDirectionLabel(null)).toBeNull()
    expect(windDirectionLabel(NaN)).toBeNull()
  })
})

describe('windArrowRotation', () => {
  it('points the arrow where the wind blows to', () => {
    expect(windArrowRotation(0)).toBe(180)
    expect(windArrowRotation(90)).toBe(270)
    expect(windArrowRotation(270)).toBe(90)
    expect(windArrowRotation(360)).toBe(180)
  })
})

describe('orderVariables', () => {
  it('orders known variables the way the widget does and appends the rest', () => {
    expect(
      orderVariables(['snow_depth', 'battery_voltage', 'date_time', 'air_temp', 'wind_speed']),
    ).toEqual(['air_temp', 'wind_speed', 'snow_depth', 'battery_voltage'])
  })
})

describe('units and names', () => {
  it('abbreviates SnowObs unit names', () => {
    expect(shortUnit('fahrenheit')).toBe('F')
    expect(shortUnit('W/m**2')).toBe('W/m2')
    expect(shortUnit('mph')).toBe('mph')
    expect(shortUnit(undefined)).toBe('')
  })

  it('shortens the long names the widget shortens', () => {
    expect(variableDisplayName('Precipitation 24hr')).toBe('Precip 24hr')
    expect(variableDisplayName('24hr Snow water equivalent diff')).toBe(
      '24hr Snow water equivalent Diff',
    )
  })
})

describe('sources', () => {
  it('renames mesowest to synoptic-data, as the widget does', () => {
    expect(normalizeSource('mesowest')).toBe('synoptic-data')
    expect(normalizeSource('nwac')).toBe('nwac')
  })

  it('colors by source, or paints everything synoptic blue when the center turned that off', () => {
    expect(sourceColor('nwac', true)).toBe('#d35400')
    expect(sourceColor('snotel', true)).toBe('#27ae60')
    expect(sourceColor('nwac', false)).toBe('#2980b9')
    expect(sourceColor('unknown', true)).toBe('#576574')
  })

  it('labels the legend the way the widget does', () => {
    expect(sourceLabel('synoptic-data')).toBe('SYNOPTIC DATA')
    expect(sourceLabel('nwac')).toBe('NWAC')
  })
})

describe('reading times', () => {
  const now = Date.parse('2026-09-10T22:30:00Z')

  it('counts whole minutes since the reading', () => {
    expect(minutesSince('2026-09-10T22:00:00Z', now)).toBe(30)
    expect(minutesSince('2026-09-10T23:00:00Z', now)).toBe(0)
  })

  it('is infinitely old with no reading', () => {
    expect(minutesSince(null, now)).toBe(Infinity)
    expect(minutesSince('not a date', now)).toBe(Infinity)
  })

  it("formats in the center's timezone, 24-hour, as the widget's MMM D HH:mm", () => {
    expect(formatObservedAt('2026-09-10T22:00:00Z', 'America/Los_Angeles')).toBe('Sep 10 15:00')
    expect(formatObservedAt('2026-01-05T03:05:00Z', 'America/Denver')).toBe('Jan 4 20:05')
  })

  it('shows a dash with no reading', () => {
    expect(formatObservedAt(null, 'America/Los_Angeles')).toBe('—')
  })

  it('falls back to UTC rather than throwing on a timezone Intl rejects', () => {
    expect(formatObservedAt('2026-09-10T22:00:00Z', 'Not/AZone')).toBe('Sep 10 22:00')
  })
})
