import { NWAC_STATION_PAGES } from '@/migrations/data/nwacStationPages'
import type { SeedPayload } from '@/migrations/data/seedStationPages'
import { seedStationPages } from '@/migrations/data/seedStationPages'

// Enough of the local API for the seed: `find` returns the tenant's pages,
// `create` records what the seed decided.
function fakePayload(existing: { slug: string }[] = []) {
  const created: Parameters<SeedPayload['create']>[0]['data'][] = []
  const payload: SeedPayload = {
    find: async () => ({ docs: existing }),
    create: async ({ data }) => {
      created.push(data)
      return { id: 1000 + created.length, ...data }
    },
  }
  return { payload, created }
}

describe('seedStationPages', () => {
  it('creates every page with its stations in page order, all from the nwac source', async () => {
    const { payload, created } = fakePayload()
    const result = await seedStationPages(payload, 7)

    expect(result.pagesCreated).toBe(NWAC_STATION_PAGES.length)
    const alpental = NWAC_STATION_PAGES.find((p) => p.stids.length > 1)
    const row = created.find((p) => p.slug === alpental?.slug)
    expect(row?.stations).toEqual(
      alpental?.stids.map((stid) => ({ stid, source: 'nwac', hiddenOnPrecipTable: false })),
    )
    expect(row?.tenant).toBe(7)
  })

  it('leaves a page that already exists exactly as it is', async () => {
    const { payload, created } = fakePayload([{ slug: NWAC_STATION_PAGES[0].slug }])
    const result = await seedStationPages(payload, 7)

    expect(result.pagesCreated).toBe(NWAC_STATION_PAGES.length - 1)
    expect(created.some((p) => p.slug === NWAC_STATION_PAGES[0].slug)).toBe(false)
  })
})
