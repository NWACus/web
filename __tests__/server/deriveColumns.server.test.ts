import { deriveColumns, resolveColumns } from '../../src/services/snowobs/deriveColumns'
import type { SnowObsTimeseriesResponse } from '../../src/services/snowobs/types/schemas'

function station(stid: string, variables: string[]): SnowObsTimeseriesResponse['STATION'][number] {
  const observations: Record<string, (number | string | null)[]> = {
    date_time: ['2026-01-01T00:00:00Z'],
  }
  for (const variable of variables) observations[variable] = [1]
  return { id: stid, stid, source: 'nwac', name: `Station ${stid}`, observations }
}

const ref = (stid: string) => ({ stid, source: 'nwac' })
const col = (stid: string, variable: string) => ({ station: ref(stid), variable })

function response(...stations: SnowObsTimeseriesResponse['STATION']): SnowObsTimeseriesResponse {
  return { UNITS: {}, VARIABLES: [], STATION: stations }
}

// The columns are what the loggers report, in a fixed reading order with the
// page's loggers in page order inside each reading -- the legacy layout.
describe('deriveColumns', () => {
  it('orders variable-major, stations in page order within each', () => {
    const res = response(
      station('3', ['air_temp', 'wind_speed', 'relative_humidity']),
      station('1', ['air_temp', 'relative_humidity', 'precip_accum_one_hour']),
    )
    expect(deriveColumns(res, [ref('3'), ref('1')])).toEqual([
      col('3', 'air_temp'),
      col('1', 'air_temp'),
      col('3', 'relative_humidity'),
      col('1', 'relative_humidity'),
      col('3', 'wind_speed'),
      col('1', 'precip_accum_one_hour'),
    ])
  })

  it('never shows battery voltage or the timestamp series as a column', () => {
    const res = response(station('4', ['battery_voltage', 'air_temp']))
    expect(deriveColumns(res, [ref('4')])).toEqual([col('4', 'air_temp')])
  })

  it('puts a reading it has no order for after the known ones, alphabetically', () => {
    const res = response(station('4', ['zeta_new_sensor', 'alpha_new_sensor', 'snow_depth']))
    expect(deriveColumns(res, [ref('4')])).toEqual([
      col('4', 'snow_depth'),
      col('4', 'alpha_new_sensor'),
      col('4', 'zeta_new_sensor'),
    ])
  })

  it("tells two sources' stations apart by more than their id", () => {
    const res = response(
      { ...station('7', ['air_temp']), source: 'nwac' },
      { ...station('7', ['snow_depth']), source: 'snotel' },
    )
    expect(deriveColumns(res, [ref('7'), { stid: '7', source: 'snotel' }])).toEqual([
      col('7', 'air_temp'),
      { station: { stid: '7', source: 'snotel' }, variable: 'snow_depth' },
    ])
  })

  it('skips a station the response did not include', () => {
    const res = response(station('4', ['air_temp']))
    expect(deriveColumns(res, [ref('4'), ref('99')])).toEqual([col('4', 'air_temp')])
  })
})

describe('resolveColumns', () => {
  const two = response(
    station('1', ['air_temp', 'wind_speed', 'snow_depth']),
    station('2', ['air_temp', 'wind_speed']),
  )
  const order = (...cols: [string, string][]) =>
    cols.map(([stid, variable]) => ({ ...ref(stid), variable }))

  it('derives when no station chose readings and the order is the default', () => {
    expect(resolveColumns(two, { stations: [ref('1'), ref('2')], columnOrder: [] })).toEqual([
      col('1', 'air_temp'),
      col('2', 'air_temp'),
      col('1', 'wind_speed'),
      col('2', 'wind_speed'),
      col('1', 'snow_depth'),
    ])
  })

  it("drops a station's hidden readings, leaving the others on all of theirs", () => {
    expect(
      resolveColumns(two, {
        stations: [{ ...ref('1'), hidden: ['air_temp', 'wind_speed'] }, ref('2')],
        columnOrder: [],
      }),
    ).toEqual([col('2', 'air_temp'), col('2', 'wind_speed'), col('1', 'snow_depth')])
  })

  it('puts the columns in the chosen order, whatever their reading', () => {
    expect(
      resolveColumns(two, {
        stations: [ref('1'), ref('2')],
        columnOrder: order(
          ['1', 'snow_depth'],
          ['2', 'air_temp'],
          ['1', 'wind_speed'],
          ['1', 'air_temp'],
          ['2', 'wind_speed'],
        ),
      }),
    ).toEqual([
      col('1', 'snow_depth'),
      col('2', 'air_temp'),
      col('1', 'wind_speed'),
      col('1', 'air_temp'),
      col('2', 'wind_speed'),
    ])
  })

  it('places a column the order does not list after the last column for its reading', () => {
    expect(
      resolveColumns(two, {
        stations: [ref('1'), ref('2')],
        columnOrder: order(['1', 'wind_speed'], ['1', 'air_temp'], ['2', 'air_temp']),
      }),
    ).toEqual([
      col('1', 'wind_speed'),
      col('2', 'wind_speed'),
      col('1', 'air_temp'),
      col('2', 'air_temp'),
      col('1', 'snow_depth'),
    ])
  })

  it('ignores an order entry with no column behind it', () => {
    expect(
      resolveColumns(two, {
        stations: [{ ...ref('1'), hidden: ['wind_speed', 'snow_depth'] }],
        columnOrder: order(['9', 'air_temp'], ['1', 'snow_depth'], ['1', 'air_temp']),
      }),
    ).toEqual([col('1', 'air_temp')])
  })
})
