import { toStationRefs, validateStations as validate } from '@/fields/stations'

describe('validateStations', () => {
  it('accepts an ordered list of source/stid pairs', () => {
    expect(
      validate([
        { stid: '1', source: 'nwac' },
        { stid: '1011', source: 'snotel' },
      ]),
    ).toBe(true)
    expect(validate(undefined)).toBe(true)
  })

  it('rejects a malformed entry', () => {
    expect(validate([{ stid: '1' }])).toMatch(/needs a SnowObs id and source/)
    expect(validate('1,2')).toMatch(/needs a SnowObs id and source/)
  })

  it('rejects the same station twice', () => {
    expect(
      validate([
        { stid: '1', source: 'nwac' },
        { stid: '1', source: 'nwac' },
      ]),
    ).toMatch(/listed twice/)
  })
})

describe('toStationRefs', () => {
  it('keeps only well-formed pairs, in order', () => {
    expect(toStationRefs([{ stid: '2', source: 'nwac' }, { stid: 3 }, null])).toEqual([
      { stid: '2', source: 'nwac' },
    ])
    expect(toStationRefs(null)).toEqual([])
  })
})
