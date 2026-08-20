import {
  getStationGroup,
  NWAC_STATION_REGIONS,
  NWAC_WEATHER_STATION_GROUPS,
  PRECIP_STATION_STIDS,
} from '../../src/constants/weatherStations'

describe('weather station registry', () => {
  it('has 32 station groups', () => {
    expect(NWAC_WEATHER_STATION_GROUPS).toHaveLength(32)
  })

  it('keeps archived stations off the accumulated precipitation table', () => {
    const helens = NWAC_WEATHER_STATION_GROUPS.find((g) => g.slug === 'mt-st-helens')
    expect(helens?.archived).toBe(true)
    // Coldwater was removed on 2026-05-14 and reports nothing, so its row would
    // read "missing" forever — legacy omits it for the same reason.
    expect(helens?.stids.every((stid) => !PRECIP_STATION_STIDS.includes(stid))).toBe(true)
  })

  it('has unique slugs and legacy slugs', () => {
    const slugs = NWAC_WEATHER_STATION_GROUPS.map((g) => g.slug)
    const legacy = NWAC_WEATHER_STATION_GROUPS.map((g) => g.legacySlug)
    expect(new Set(slugs).size).toBe(slugs.length)
    expect(new Set(legacy).size).toBe(legacy.length)
  })

  it('assigns every group to a known region', () => {
    for (const group of NWAC_WEATHER_STATION_GROUPS) {
      expect(NWAC_STATION_REGIONS).toContain(group.region)
    }
  })

  it('derives stids from the columns and lists them uniquely', () => {
    for (const group of NWAC_WEATHER_STATION_GROUPS) {
      const fromColumns = [...new Set(group.columns.map(([stid]) => stid))]
      expect(group.stids).toEqual(fromColumns)
      expect(group.stids.length).toBeGreaterThan(0)
    }
  })

  it('excludes precip_cumsum columns (the transform derives them)', () => {
    for (const group of NWAC_WEATHER_STATION_GROUPS) {
      expect(group.columns.some(([, sensor]) => sensor === 'precip_cumsum')).toBe(false)
    }
  })

  it('looks groups up by slug', () => {
    expect(getStationGroup('hurricane-ridge')?.displayName).toBe('Hurricane Ridge')
    expect(getStationGroup('nope')).toBeUndefined()
  })
})
