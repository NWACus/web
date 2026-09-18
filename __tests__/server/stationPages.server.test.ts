import { allStations, assembleStationPages } from '../../src/services/stations/stationPages'

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
    expect(pages[0].stids).toEqual(['3', '2', '1'])
    expect(pages[0].stations[1]).toEqual({ stid: '2', source: 'nwac' })
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
    expect(allStations(pages).get('1011')).toEqual({ stid: '1011', source: 'snotel' })
    expect(allStations(pages).has('245')).toBe(false)
  })
})
