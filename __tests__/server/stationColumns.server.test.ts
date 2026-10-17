import { orderToSave, readingLabel, toColumnOrder } from '@/services/stations/stationColumns'

describe('toColumnOrder', () => {
  it('keeps well-formed station readings, in order', () => {
    expect(
      toColumnOrder([
        { stid: '2', source: 'nwac', variable: 'snow_depth' },
        { stid: '1', source: 'nwac' },
        null,
        { stid: '1', source: 'nwac', variable: 'air_temp', extra: true },
      ]),
    ).toEqual([
      { stid: '2', source: 'nwac', variable: 'snow_depth' },
      { stid: '1', source: 'nwac', variable: 'air_temp' },
    ])
    expect(toColumnOrder(undefined)).toEqual([])
  })
})

describe('readingLabel', () => {
  it("uses the table's short label, or the variable when there is none", () => {
    expect(readingLabel('air_temp')).toBe('Temp')
    expect(readingLabel('new_sensor')).toBe('new_sensor')
  })
})

describe('orderToSave', () => {
  const col = (stid: string, variable: string) => ({ station: { stid, source: 'nwac' }, variable })
  const defaults = [col('1', 'air_temp'), col('2', 'air_temp'), col('1', 'snow_depth')]

  it('stores nothing for the default arrangement', () => {
    expect(orderToSave([...defaults], defaults)).toEqual([])
  })

  it('stores every column for any other arrangement', () => {
    expect(orderToSave([defaults[2], defaults[0], defaults[1]], defaults)).toEqual([
      { stid: '1', source: 'nwac', variable: 'snow_depth' },
      { stid: '1', source: 'nwac', variable: 'air_temp' },
      { stid: '2', source: 'nwac', variable: 'air_temp' },
    ])
  })
})
