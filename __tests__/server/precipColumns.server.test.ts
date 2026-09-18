import { ALL_PRECIP_COLUMNS, toPrecipColumns } from '@/services/stations/precipColumns'

describe('toPrecipColumns', () => {
  it('keeps a valid selection in order', () => {
    expect(toPrecipColumns(['72h', '1h', 'elevation'])).toEqual(['72h', '1h', 'elevation'])
  })

  it('drops unknown values and falls back to every column when nothing is left', () => {
    expect(toPrecipColumns(['bogus'])).toEqual(ALL_PRECIP_COLUMNS)
    expect(toPrecipColumns(undefined)).toEqual(ALL_PRECIP_COLUMNS)
    expect(toPrecipColumns([])).toEqual(ALL_PRECIP_COLUMNS)
  })
})
