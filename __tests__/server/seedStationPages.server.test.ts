import { NWAC_PRECIP_STATIONS, NWAC_STATION_PAGES } from '@/migrations/data/nwacStationPages'
import type { SeedPayload } from '@/migrations/data/seedStationPages'
import { seedStationPages } from '@/migrations/data/seedStationPages'

type Created = { collection: string; data: Record<string, unknown> }

// Enough of the local API for the seed: `find` answers per collection,
// `create` records what the seed decided.
function fakePayload({
  pages = [],
  settings = [],
}: { pages?: { slug: string }[]; settings?: { slug: string }[] } = {}) {
  const created: Created[] = []
  const payload: SeedPayload = {
    find: async ({ collection }: { collection: string }) => ({
      docs: collection === 'stationPages' ? pages : settings,
    }),
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

  it('seeds the precip table with the stations that have a gauge, in page order', async () => {
    const { payload, created } = fakePayload()
    const result = await seedStationPages(payload, 7)

    const settings = created.find((c) => c.collection === 'weatherStationSettings')
    const onPages = new Set(NWAC_STATION_PAGES.flatMap((p) => p.stids))
    expect(result.settingsCreated).toBe(true)
    expect(settings?.data.precipStations).toEqual(
      NWAC_PRECIP_STATIONS.map((stid) => ({ stid, source: 'nwac' })),
    )
    expect(NWAC_PRECIP_STATIONS.every((stid) => onPages.has(stid))).toBe(true)
  })

  it('leaves a page and settings that already exist exactly as they are', async () => {
    const { payload, created } = fakePayload({
      pages: [{ slug: NWAC_STATION_PAGES[0].slug }],
      settings: [{ slug: 'nwac' }],
    })
    const result = await seedStationPages(payload, 7)

    expect(result).toEqual({ pagesCreated: NWAC_STATION_PAGES.length - 1, settingsCreated: false })
    expect(createdPages(created).some((c) => c.data.slug === NWAC_STATION_PAGES[0].slug)).toBe(
      false,
    )
    expect(created.some((c) => c.collection === 'weatherStationSettings')).toBe(false)
  })
})
