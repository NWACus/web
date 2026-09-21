import { STATION_COLUMNS, toStationColumns } from '@/services/stations/stationColumns'

describe('toStationColumns', () => {
  it('keeps known readings in the order chosen', () => {
    expect(toStationColumns(['snow_depth', 'air_temp'])).toEqual(['snow_depth', 'air_temp'])
  })

  it('drops unknown values and treats nothing chosen as empty', () => {
    expect(toStationColumns(['bogus', 'wind_speed'])).toEqual(['wind_speed'])
    expect(toStationColumns(undefined)).toEqual([])
    expect(toStationColumns([])).toEqual([])
  })

  it('offers every table reading with a short label', () => {
    expect(STATION_COLUMNS.map((c) => c.value)).toContain('precip_accum_one_hour')
    expect(STATION_COLUMNS.find((c) => c.value === 'air_temp')?.label).toBe('Temp (air_temp)')
  })
})
