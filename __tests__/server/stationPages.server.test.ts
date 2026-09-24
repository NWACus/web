import {
  allStations,
  areaPageFor,
  assembleStationPages,
} from '../../src/services/stations/stationPages'

type PageDoc = Parameters<typeof assembleStationPages>[0][number]

function pageDoc(overrides: Partial<PageDoc> & Pick<PageDoc, 'slug'>): PageDoc {
  return { displayName: overrides.slug, archived: false, stations: [], ...overrides }
}

const ref = (stid: string, source = 'nwac') => ({ stid, source })

describe('assembleStationPages', () => {
  it('lists pages alphabetically by display name', () => {
    const pages = assembleStationPages([
      pageDoc({ slug: 'paradise', displayName: 'Paradise' }),
      pageDoc({ slug: 'alpental', displayName: 'Alpental Ski Area' }),
      pageDoc({ slug: 'hurricane', displayName: 'Hurricane Ridge' }),
    ])
    expect(pages.map((p) => p.slug)).toEqual(['alpental', 'hurricane', 'paradise'])
  })

  it('keeps stations in the order the editor arranged them', () => {
    const pages = assembleStationPages([
      pageDoc({ slug: 'alpental', stations: [ref('3'), ref('2'), ref('1')] }),
    ])
    expect(pages[0].stations.map((s) => s.stid)).toEqual(['3', '2', '1'])
    expect(pages[0].stations[1]).toEqual({ stid: '2', source: 'nwac' })
  })

  it('carries the chosen readings, or none', () => {
    const pages = assembleStationPages([
      pageDoc({ slug: 'a', stations: [ref('1')], columns: ['air_temp'] }),
      pageDoc({ slug: 'b', columns: undefined }),
    ])
    expect(pages[0].columns).toEqual(['air_temp'])
    expect(pages[1].columns).toEqual([])
  })

  it('treats a page with no stations as empty rather than missing', () => {
    const pages = assembleStationPages([pageDoc({ slug: 'a', stations: undefined })])
    expect(pages[0].stations).toEqual([])
  })
})

describe('allStations', () => {
  it('maps every stid on any page back to its source', () => {
    const pages = assembleStationPages([
      pageDoc({ slug: 'a', stations: [ref('1')] }),
      pageDoc({ slug: 'b', stations: [ref('1011', 'snotel')] }),
    ])
    expect(allStations(pages).get('snotel:1011')).toEqual({ stid: '1011', source: 'snotel' })
    expect(allStations(pages).has('nwac:1011')).toBe(false)
    expect(allStations(pages).has('nwac:245')).toBe(false)
  })
})

describe('areaPageFor', () => {
  const page = (slug: string, archived: boolean, stids: string[]) => ({
    slug,
    displayName: slug,
    archived,
    stations: stids.map((stid) => ref(stid)),
  })

  it('finds the page that lists a station among others', () => {
    expect(areaPageFor([page('alpental', false, ['1', '2', '3'])], ref('2'))?.slug).toBe('alpental')
  })

  it('prefers a live page over an archived one that lists the same station', () => {
    const pages = [page('old-site', true, ['1']), page('new-site', false, ['1'])]
    expect(areaPageFor(pages, ref('1'))?.slug).toBe('new-site')
  })

  it('still offers an archived page when that is the only one', () => {
    expect(areaPageFor([page('old-site', true, ['1'])], ref('1'))?.slug).toBe('old-site')
  })

  it('matches on source and stid, since a stid is unique only within a source', () => {
    expect(areaPageFor([page('alpental', false, ['502'])], ref('502', 'snotel'))).toBeNull()
  })
})
