import { toStationEntries, toStationRefs, validateStations as validate } from '@/fields/stations'

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

  it("accepts a station's chosen readings and rejects a malformed list", () => {
    expect(validate([{ stid: '1', source: 'nwac', columns: ['air_temp'] }])).toBe(true)
    expect(validate([{ stid: '1', source: 'nwac', columns: 'air_temp' }])).toMatch(
      /list of readings/,
    )
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

describe('toStationEntries', () => {
  it("keeps a station's chosen readings and drops anything else", () => {
    expect(
      toStationEntries([
        { stid: '1', source: 'nwac', columns: ['air_temp'], extra: 1 },
        { stid: '2', source: 'nwac', columns: 'bogus' },
      ]),
    ).toEqual([
      { stid: '1', source: 'nwac', columns: ['air_temp'] },
      { stid: '2', source: 'nwac' },
    ])
  })

  it('reduces entries to bare references for toStationRefs', () => {
    expect(toStationRefs([{ stid: '1', source: 'nwac', columns: [] }])).toEqual([
      { stid: '1', source: 'nwac' },
    ])
  })
})
