import {
  CENTERS_WITH_STATIONS,
  getStationGroup,
  getStationRegistry,
  precipStationStids,
} from '../../src/constants/weatherStations'

function nwac() {
  const registry = getStationRegistry('nwac')
  if (!registry) throw new Error('NWAC has no station registry')
  return registry
}

describe('weather station registry', () => {
  it('has 32 NWAC station groups and no other center yet', () => {
    expect(nwac().groups).toHaveLength(32)
    expect(CENTERS_WITH_STATIONS).toEqual(['nwac'])
    expect(getStationRegistry('sac')).toBeUndefined()
    expect(getStationRegistry('not-a-center')).toBeUndefined()
  })

  it('keeps archived stations off the accumulated precipitation table', () => {
    const helens = getStationGroup('nwac', 'mt-st-helens')
    const stids = precipStationStids(nwac())
    expect(helens?.archived).toBe(true)
    expect(helens?.stids.every((stid) => !stids.includes(stid))).toBe(true)
  })

  it('has unique slugs and legacy slugs', () => {
    const slugs = nwac().groups.map((g) => g.slug)
    const legacy = nwac().groups.map((g) => g.legacySlug)
    expect(new Set(slugs).size).toBe(slugs.length)
    expect(new Set(legacy).size).toBe(legacy.length)
  })

  it('files every group under a listed region', () => {
    for (const group of nwac().groups) {
      expect(nwac().regions).toContain(group.region)
    }
  })

  it('only configures columns for stids the group fetches', () => {
    for (const group of nwac().groups) {
      for (const [stid] of group.columns) {
        expect(group.stids).toContain(stid)
      }
    }
  })

  it('has no duplicate stids within a group', () => {
    for (const group of nwac().groups) {
      expect(new Set(group.stids).size).toBe(group.stids.length)
    }
  })

  it('looks up groups by center and slug', () => {
    expect(getStationGroup('nwac', 'hurricane-ridge')?.displayName).toBe('Hurricane Ridge')
    expect(getStationGroup('nwac', 'nope')).toBeUndefined()
    expect(getStationGroup('sac', 'hurricane-ridge')).toBeUndefined()
  })
})
