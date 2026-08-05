import {
  getStationGroup,
  NWAC_STATION_REGIONS,
  NWAC_WEATHER_STATION_GROUPS,
} from '../../src/constants/weatherStations'

describe('weather station registry', () => {
  it('has 31 station groups', () => {
    expect(NWAC_WEATHER_STATION_GROUPS).toHaveLength(31)
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
