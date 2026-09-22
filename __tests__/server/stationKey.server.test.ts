import { parseStationKey, parseStationKeys, stationKey } from '@/services/snowobs/stationKey'

describe('stationKey', () => {
  it('joins the pair that identifies a station', () => {
    expect(stationKey({ stid: '1', source: 'nwac' })).toBe('nwac:1')
    expect(stationKey({ stid: 'BRIW1', source: 'mesowest' })).toBe('mesowest:BRIW1')
  })
})

describe('parseStationKey', () => {
  it('reads a pair back, keeping a stid that contains a colon', () => {
    expect(parseStationKey('snotel:1011')).toEqual({ stid: '1011', source: 'snotel' })
    expect(parseStationKey('nwac:a:b')).toEqual({ stid: 'a:b', source: 'nwac' })
  })

  it('rejects anything that is not source:stid', () => {
    expect(parseStationKey('1011')).toBeNull()
    expect(parseStationKey(':1011')).toBeNull()
    expect(parseStationKey('snotel:')).toBeNull()
    expect(parseStationKey('')).toBeNull()
  })
})

describe('parseStationKeys', () => {
  it('reads a comma list, trimming blanks', () => {
    expect(parseStationKeys('nwac:1, snotel:1011 ,', 10)).toEqual([
      { stid: '1', source: 'nwac' },
      { stid: '1011', source: 'snotel' },
    ])
  })

  it('says why an empty or oversized list is unusable', () => {
    expect(parseStationKeys('', 10)).toMatch(/must list 1-10/)
    expect(parseStationKeys(null, 10)).toMatch(/must list 1-10/)
    expect(parseStationKeys('nwac:1,nwac:2', 1)).toMatch(/must list 1-1/)
  })

  it('says why a malformed entry is unusable', () => {
    expect(parseStationKeys('nwac:1,1011', 10)).toMatch(/source:stid pairs/)
  })
})
