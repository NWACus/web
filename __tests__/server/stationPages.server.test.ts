import {
  allStationIds,
  assembleStationPages,
  precipStationIds,
} from '../../src/services/stations/stationPages'

type Group = Parameters<typeof assembleStationPages>[0][number]
type Station = Parameters<typeof assembleStationPages>[1][number]

function group(overrides: Partial<Group> & Pick<Group, 'id' | 'slug'>): Group {
  return {
    displayName: overrides.slug,
    archived: false,
    graphAxes: {},
    ...overrides,
  }
}

function station(overrides: Partial<Station> & Pick<Station, 'stid'>): Station {
  return { name: `Station ${overrides.stid}`, elevation: null, group: null, ...overrides }
}

describe('assembleStationPages', () => {
  it('lists pages alphabetically by display name', () => {
    const pages = assembleStationPages(
      [
        group({ id: 1, slug: 'paradise', displayName: 'Paradise' }),
        group({ id: 2, slug: 'alpental', displayName: 'Alpental Ski Area' }),
        group({ id: 3, slug: 'hurricane', displayName: 'Hurricane Ridge' }),
      ],
      [],
    )
    expect(pages.map((p) => p.slug)).toEqual(['alpental', 'hurricane', 'paradise'])
  })

  it('orders a page’s stations by group order, then elevation highest first', () => {
    const pages = assembleStationPages(
      [group({ id: 1, slug: 'alpental' })],
      [
        station({ stid: '1', group: 1, elevation: 3100 }),
        station({ stid: '3', group: 1, elevation: 5470 }),
        station({ stid: '2', group: 1, elevation: 4350 }),
        station({ stid: '9', group: 1, elevation: 100, groupOrder: 0 }),
      ],
    )
    expect(pages[0].stids).toEqual(['9', '3', '2', '1'])
  })

  it('leaves an unassigned station off every page', () => {
    const pages = assembleStationPages(
      [group({ id: 1, slug: 'a' })],
      [station({ stid: '1', group: 1 }), station({ stid: '245', group: null })],
    )
    expect(allStationIds(pages)).toEqual(new Set(['1']))
  })

  it('carries the page’s graph axis floors through', () => {
    const pages = assembleStationPages(
      [group({ id: 1, slug: 'paradise', graphAxes: { snowDepthMax: 225 } })],
      [],
    )
    expect(pages[0].graphAxes).toEqual({ snowDepthMax: 225, snowfall24Max: null, precipMax: null })
  })
})

describe('precipStationIds', () => {
  it('drops hidden gauges and every station on an archived page', () => {
    const pages = assembleStationPages(
      [group({ id: 1, slug: 'live' }), group({ id: 2, slug: 'gone', archived: true })],
      [
        station({ stid: '1', group: 1 }),
        station({ stid: '44', group: 1, hiddenOnPrecipTable: true }),
        station({ stid: '40', group: 2 }),
      ],
    )
    expect(precipStationIds(pages)).toEqual(['1'])
  })
})
