import type { SeedPayload } from '@/migrations/20260918_223529_station_pages'
import { NWAC_STATION_PAGES, seedStationPages } from '@/migrations/20260918_223529_station_pages'

// The migration module pulls in the sqlite adapter for `sql`; the seed under
// test never runs SQL.
jest.mock('@payloadcms/db-sqlite', () => ({ sql: () => '' }))

type Created = { collection: string; data: Record<string, unknown> }

// Enough of the local API for the seed: `find` answers per collection,
// `create` records what the seed decided.
function fakePayload({ pages = [] }: { pages?: { slug: string }[] } = {}) {
  const created: Created[] = []
  const payload: SeedPayload = {
    find: async () => ({ docs: pages }),
    create: async ({ collection, data }: Created) => {
      created.push({ collection, data })
      return { id: 1000 + created.length, ...data }
    },
  }
  return { payload, created }
}

const createdPages = (created: Created[]) => created.filter((c) => c.collection === 'stationPages')

describe('seedStationPages', () => {
  it('creates every page with its stations in page order, all from the nwac source', async () => {
    const { payload, created } = fakePayload()
    const result = await seedStationPages(payload, 7)

    expect(result.pagesCreated).toBe(NWAC_STATION_PAGES.length)
    const alpental = NWAC_STATION_PAGES.find((p) => p.stids.length > 1)
    const row = createdPages(created).find((c) => c.data.slug === alpental?.slug)
    expect(row?.data.stations).toEqual(alpental?.stids.map((stid) => ({ stid, source: 'nwac' })))
    expect(row?.data.tenant).toBe(7)
  })

  it('leaves a page that already exists exactly as it is', async () => {
    const { payload, created } = fakePayload({ pages: [{ slug: NWAC_STATION_PAGES[0].slug }] })
    const result = await seedStationPages(payload, 7)

    expect(result).toEqual({ pagesCreated: NWAC_STATION_PAGES.length - 1 })
    expect(createdPages(created).some((c) => c.data.slug === NWAC_STATION_PAGES[0].slug)).toBe(
      false,
    )
  })

  it('creates only the pages it is given', async () => {
    const { payload, created } = fakePayload()
    const result = await seedStationPages(payload, 7, NWAC_STATION_PAGES.slice(0, 2))

    expect(result.pagesCreated).toBe(2)
    expect(createdPages(created).map((c) => c.data.slug)).toEqual(
      NWAC_STATION_PAGES.slice(0, 2).map((p) => p.slug),
    )
  })
})
