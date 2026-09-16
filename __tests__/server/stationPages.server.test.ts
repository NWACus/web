import {
  allStationIds,
  assembleStationPages,
  precipStationIds,
} from '../../src/services/stations/stationPages'

type PageDoc = Parameters<typeof assembleStationPages>[0][number]
type Station = Parameters<typeof assembleStationPages>[1][number]

function pageDoc(overrides: Partial<PageDoc> & Pick<PageDoc, 'id' | 'slug'>): PageDoc {
  return {
    displayName: overrides.slug,
    archived: false,
    ...overrides,
  }
}

function station(overrides: Partial<Station> & Pick<Station, 'stid'>): Station {
  return { name: `Station ${overrides.stid}`, elevation: null, page: null, ...overrides }
}

describe('assembleStationPages', () => {
  it('lists pages alphabetically by display name', () => {
    const pages = assembleStationPages(
      [
        pageDoc({ id: 1, slug: 'paradise', displayName: 'Paradise' }),
        pageDoc({ id: 2, slug: 'alpental', displayName: 'Alpental Ski Area' }),
        pageDoc({ id: 3, slug: 'hurricane', displayName: 'Hurricane Ridge' }),
      ],
      [],
    )
    expect(pages.map((p) => p.slug)).toEqual(['alpental', 'hurricane', 'paradise'])
  })

  it('orders a page’s stations by page order, then elevation highest first', () => {
    const pages = assembleStationPages(
      [pageDoc({ id: 1, slug: 'alpental' })],
      [
        station({ stid: '1', page: 1, elevation: 3100 }),
        station({ stid: '3', page: 1, elevation: 5470 }),
        station({ stid: '2', page: 1, elevation: 4350 }),
        station({ stid: '9', page: 1, elevation: 100, pageOrder: 0 }),
      ],
    )
    expect(pages[0].stids).toEqual(['9', '3', '2', '1'])
  })

  it('leaves an unassigned station off every page', () => {
    const pages = assembleStationPages(
      [pageDoc({ id: 1, slug: 'a' })],
      [station({ stid: '1', page: 1 }), station({ stid: '245', page: null })],
    )
    expect(allStationIds(pages)).toEqual(new Set(['1']))
  })
})

describe('precipStationIds', () => {
  it('drops hidden gauges and every station on an archived page', () => {
    const pages = assembleStationPages(
      [pageDoc({ id: 1, slug: 'live' }), pageDoc({ id: 2, slug: 'gone', archived: true })],
      [
        station({ stid: '1', page: 1 }),
        station({ stid: '44', page: 1, hiddenOnPrecipTable: true }),
        station({ stid: '40', page: 2 }),
      ],
    )
    expect(precipStationIds(pages)).toEqual(['1'])
  })
})
