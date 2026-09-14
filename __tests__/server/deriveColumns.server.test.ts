import { deriveColumns } from '../../src/services/snowobs/deriveColumns'
import type { SnowObsTimeseriesResponse } from '../../src/services/snowobs/types/schemas'

function station(stid: string, variables: string[]): SnowObsTimeseriesResponse['STATION'][number] {
  const observations: Record<string, (number | string | null)[]> = {
    date_time: ['2026-01-01T00:00:00Z'],
  }
  for (const variable of variables) observations[variable] = [1]
  return { id: stid, stid, name: `Station ${stid}`, observations }
}

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
    expect(deriveColumns(res, ['3', '1'])).toEqual([
      ['3', 'air_temp'],
      ['1', 'air_temp'],
      ['3', 'relative_humidity'],
      ['1', 'relative_humidity'],
      ['3', 'wind_speed'],
      ['1', 'precip_accum_one_hour'],
    ])
  })

  it('never shows battery voltage or the timestamp series as a column', () => {
    const res = response(station('4', ['battery_voltage', 'air_temp']))
    expect(deriveColumns(res, ['4'])).toEqual([['4', 'air_temp']])
  })

  it('puts a reading it has no order for after the known ones, alphabetically', () => {
    const res = response(station('4', ['zeta_new_sensor', 'alpha_new_sensor', 'snow_depth']))
    expect(deriveColumns(res, ['4'])).toEqual([
      ['4', 'snow_depth'],
      ['4', 'alpha_new_sensor'],
      ['4', 'zeta_new_sensor'],
    ])
  })

  it('skips a station the response did not include', () => {
    const res = response(station('4', ['air_temp']))
    expect(deriveColumns(res, ['4', '99'])).toEqual([['4', 'air_temp']])
  })
})
