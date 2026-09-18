import {
  allStations,
  assembleStationPages,
  precipStations,
} from '../../src/services/stations/stationPages'

type PageDoc = Parameters<typeof assembleStationPages>[0][number]
type Station = NonNullable<PageDoc['stations']>[number]

function pageDoc(overrides: Partial<PageDoc> & Pick<PageDoc, 'slug'>): PageDoc {
  return { displayName: overrides.slug, archived: false, stations: [], ...overrides }
}

function station(stid: string, overrides: Partial<Station> = {}): Station {
  return { stid, source: 'nwac', hiddenOnPrecipTable: false, ...overrides }
}

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
      pageDoc({ slug: 'alpental', stations: [station('3'), station('2'), station('1')] }),
    ])
    expect(pages[0].stids).toEqual(['3', '2', '1'])
    expect(pages[0].stations[1]).toEqual({ stid: '2', source: 'nwac', hiddenOnPrecipTable: false })
  })

  it('treats a page with no stations as empty rather than missing', () => {
    const pages = assembleStationPages([pageDoc({ slug: 'a', stations: null })])
    expect(pages[0].stations).toEqual([])
  })
})

describe('allStations', () => {
  it('maps every stid on any page back to its source', () => {
    const pages = assembleStationPages([
      pageDoc({ slug: 'a', stations: [station('1')] }),
      pageDoc({ slug: 'b', stations: [station('1011', { source: 'snotel' })] }),
    ])
    expect(allStations(pages).get('1011')).toEqual({ stid: '1011', source: 'snotel' })
    expect(allStations(pages).has('245')).toBe(false)
  })
})

describe('precipStations', () => {
  it('drops hidden gauges and every station on an archived page', () => {
    const pages = assembleStationPages([
      pageDoc({
        slug: 'live',
        stations: [station('1'), station('44', { hiddenOnPrecipTable: true })],
      }),
      pageDoc({ slug: 'gone', archived: true, stations: [station('40')] }),
    ])
    expect(precipStations(pages)).toEqual([{ stid: '1', source: 'nwac' }])
  })
})
