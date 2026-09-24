import type { StationMapStation } from '@/services/snowobs/stationMap/model'
import {
  DEFAULT_TABLE_SORT,
  columnLabel,
  groupStations,
  hasThresholdColumns,
  nextSort,
  sortStations,
  tableColumns,
  thresholdCrossing,
  timeZoneLabel,
} from '@/services/snowobs/stationMap/table'

function station(overrides: Partial<StationMapStation>): StationMapStation {
  return {
    stid: '1',
    name: 'Station',
    source: 'nwac',
    coordinates: [-121, 47],
    elevation: 3000,
    observedAt: '2026-09-10T22:00:00Z',
    data: {},
    zone: 'Olympics',
    href: null,
    ...overrides,
  }
}

const names = (stations: StationMapStation[]) => stations.map((s) => s.name)

describe('the table columns', () => {
  it('lead with station, elevation and time, then the variables in the widget order', () => {
    const columns = tableColumns([
      { variable: 'wind_speed', longName: 'Wind Speed' },
      { variable: 'battery_voltage', longName: 'Battery Voltage' },
      { variable: 'air_temp', longName: 'Air Temperature' },
      { variable: 'date_time', longName: 'Date Time' },
    ])
    expect(columns).toEqual([
      'station',
      'elevation',
      'date_time',
      'air_temp',
      'wind_speed',
      'battery_voltage',
    ])
  })

  it('are headed with the widget short names, and its initials for a variable it has none for', () => {
    expect(columnLabel('elevation')).toBe('Elev')
    expect(columnLabel('date_time')).toBe('Time')
    expect(columnLabel('snow_water_equiv_24hr')).toBe('∆SWE')
    // The widget spaced out only the first underscore — these are its headers on production.
    expect(columnLabel('soil_temperature_b')).toBe('ST')
    expect(columnLabel('precip_accum_three_hour')).toBe('PA')
    expect(columnLabel('weather_prod_cond_code')).toBe('WP')
    expect(columnLabel('battery_voltage')).toBe('BV')
  })

  it("label the time column with the center's zone, whatever zone the browser is in", () => {
    expect(timeZoneLabel('America/Los_Angeles', new Date('2026-01-15T12:00:00Z'))).toBe('PST')
    expect(timeZoneLabel('America/Denver', new Date('2026-07-15T12:00:00Z'))).toBe('MDT')
    expect(timeZoneLabel('Not/AZone', new Date())).toBe('UTC')
  })
})

describe('sorting the table', () => {
  it('starts at elevation ascending', () => {
    expect(DEFAULT_TABLE_SORT).toEqual({ column: 'elevation', direction: 'asc' })
  })

  it('reverses on a second click, and starts a new column descending as the widget does', () => {
    expect(nextSort(DEFAULT_TABLE_SORT, 'elevation')).toEqual({
      column: 'elevation',
      direction: 'desc',
    })
    expect(nextSort(DEFAULT_TABLE_SORT, 'air_temp')).toEqual({
      column: 'air_temp',
      direction: 'desc',
    })
  })

  const low = station({ stid: 'a', name: 'Low', elevation: 1000, data: { air_temp: 30 } })
  const high = station({ stid: 'b', name: 'High', elevation: 5000, data: { air_temp: 20 } })
  const noSensor = station({ stid: 'c', name: 'Bare', elevation: 3000, data: {} })

  it('sorts numbers both ways', () => {
    expect(names(sortStations([high, low], { column: 'elevation', direction: 'asc' }))).toEqual([
      'Low',
      'High',
    ])
    expect(names(sortStations([low, high], { column: 'elevation', direction: 'desc' }))).toEqual([
      'High',
      'Low',
    ])
  })

  it('sorts names alphabetically, and times by instant', () => {
    expect(names(sortStations([low, high], { column: 'station', direction: 'asc' }))).toEqual([
      'High',
      'Low',
    ])
    const earlier = station({ name: 'Earlier', observedAt: '2026-09-10T20:00:00Z' })
    const later = station({ name: 'Later', observedAt: '2026-09-10T22:00:00Z' })
    expect(
      names(sortStations([earlier, later], { column: 'date_time', direction: 'desc' })),
    ).toEqual(['Later', 'Earlier'])
  })

  it('puts a station without the reading last in either direction', () => {
    const stations = [noSensor, low, high]
    expect(names(sortStations(stations, { column: 'air_temp', direction: 'asc' }))).toEqual([
      'High',
      'Low',
      'Bare',
    ])
    expect(names(sortStations(stations, { column: 'air_temp', direction: 'desc' }))).toEqual([
      'Low',
      'High',
      'Bare',
    ])
  })
})

describe('grouping the table by zone', () => {
  const sort = DEFAULT_TABLE_SORT

  it('groups in the zone filter order, sorts within each zone, and skips empty zones', () => {
    const groups = groupStations(
      [
        station({ stid: '1', name: 'Hood High', zone: 'Mt Hood', elevation: 6000 }),
        station({ stid: '2', name: 'Olympic', zone: 'Olympics', elevation: 5000 }),
        station({ stid: '3', name: 'Hood Low', zone: 'Mt Hood', elevation: 2000 }),
      ],
      ['Olympics', 'Stevens Pass', 'Mt Hood'],
      sort,
    )
    expect(groups.map((g) => [g.zone, names(g.stations)])).toEqual([
      ['Olympics', ['Olympic']],
      ['Mt Hood', ['Hood Low', 'Hood High']],
    ])
  })

  it('ends with Other, and never drops a station whose zone the list does not name', () => {
    const groups = groupStations(
      [
        station({ stid: '1', name: 'Outside', zone: 'Other' }),
        station({ stid: '2', name: 'Unlisted', zone: 'Somewhere Else' }),
        station({ stid: '3', name: 'Inside', zone: 'Olympics' }),
      ],
      ['Olympics'],
      sort,
    )
    expect(groups.map((g) => g.zone)).toEqual(['Olympics', 'Other', 'Somewhere Else'])
  })
})

describe('threshold colors', () => {
  const level = (variable: string, value: number | null, unit: string) =>
    thresholdCrossing(variable, value, unit)?.level ?? null

  it('color the widget thresholds, the highest one crossed winning', () => {
    expect(level('air_temp', 33, 'fahrenheit')).toBe('orange')
    expect(level('air_temp', 32, 'fahrenheit')).toBeNull()
    expect(level('wind_speed', 11, 'mph')).toBe('yellow')
    expect(level('wind_speed', 25, 'mph')).toBe('orange')
    expect(thresholdCrossing('wind_speed', 41, 'mph')).toEqual({ level: 'red', above: 40 })
    expect(level('snow_depth_24hr', 13, 'inches')).toBe('orange')
    expect(level('snow_water_equiv_24hr', 1.6, 'inches')).toBe('orange')
  })

  it('leave a reading uncolored when it is missing, or not in the units the rule was written in', () => {
    expect(level('wind_speed', null, 'mph')).toBeNull()
    expect(level('air_temp', 40, 'celsius')).toBeNull()
    expect(level('snow_depth_24hr', 300, 'millimeters')).toBeNull()
    expect(level('relative_humidity', 99, '%')).toBeNull()
  })

  it('are offered only when a column shown is in the units a rule was written in', () => {
    const units = { air_temp: 'fahrenheit', snow_depth_24hr: 'inches', relative_humidity: '%' }
    expect(hasThresholdColumns(['air_temp', 'relative_humidity'], units)).toBe(true)
    // SnowObs lists units for variables the center doesn't report.
    expect(hasThresholdColumns(['relative_humidity'], units)).toBe(false)
    expect(hasThresholdColumns(['air_temp'], { air_temp: 'celsius' })).toBe(false)
  })
})
