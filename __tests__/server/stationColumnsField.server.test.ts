import { toStationColumns, validateColumns as validate } from '@/fields/stationColumns'

const stations = [
  { stid: '1', source: 'nwac' },
  { stid: '1011', source: 'snotel' },
]

describe('validateColumns', () => {
  it('accepts an ordered list of readings from stations on the page', () => {
    expect(
      validate(
        [
          { stid: '1011', variable: 'snow_depth' },
          { stid: '1', variable: 'air_temp' },
        ],
        stations,
      ),
    ).toBe(true)
    expect(validate(undefined, stations)).toBe(true)
    expect(validate([], [])).toBe(true)
  })

  it('rejects a malformed entry', () => {
    expect(validate([{ stid: '1' }], stations)).toMatch(/needs a station id and a reading/)
    expect(validate('1:air_temp', stations)).toMatch(/needs a station id and a reading/)
  })

  it('rejects the same column twice', () => {
    expect(
      validate(
        [
          { stid: '1', variable: 'air_temp' },
          { stid: '1', variable: 'air_temp' },
        ],
        stations,
      ),
    ).toMatch(/listed twice/)
  })

  it('rejects a station that is not on the page', () => {
    expect(validate([{ stid: '2', variable: 'air_temp' }], stations)).toMatch(
      /Station 2 is not on this page/,
    )
    expect(validate([{ stid: '1', variable: 'air_temp' }], undefined)).toMatch(/not on this page/)
  })
})

describe('toStationColumns', () => {
  it('keeps only well-formed pairs, in order', () => {
    expect(toStationColumns([{ stid: '2', variable: 'air_temp' }, { stid: 3 }, null, 'x'])).toEqual(
      [{ stid: '2', variable: 'air_temp' }],
    )
    expect(toStationColumns(null)).toEqual([])
  })
})
