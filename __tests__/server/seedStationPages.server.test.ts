import { NWAC_STATION_PAGES, NWAC_STATION_SNAPSHOT } from '@/migrations/data/nwacStationPages'
import { seedStationPages } from '@/migrations/data/seedStationPages'
import type { BasePayload } from 'payload'

type Row = { id: number; [key: string]: unknown }

// Enough of the local API for the seed: rows live in memory, `find` filters on
// tenant/source, `create` and `update` record what the seed decided.
function fakePayload(initial: { stationPages?: Row[]; stations?: Row[] } = {}) {
  const tables: Record<string, Row[]> = {
    stationPages: initial.stationPages ?? [],
    stations: initial.stations ?? [],
  }
  let nextId = 1000
  const updates: { collection: string; id: number; data: Record<string, unknown> }[] = []

  const payload = {
    find: jest.fn(async ({ collection }: { collection: string }) => ({
      docs: tables[collection],
    })),
    create: jest.fn(
      async ({ collection, data }: { collection: string; data: Record<string, unknown> }) => {
        const row = { id: nextId++, ...data }
        tables[collection].push(row)
        return row
      },
    ),
    update: jest.fn(
      async ({
        collection,
        id,
        data,
      }: {
        collection: string
        id: number
        data: Record<string, unknown>
      }) => {
        updates.push({ collection, id, data })
        const row = tables[collection].find((r) => r.id === id)
        Object.assign(row ?? {}, data)
        return row
      },
    ),
  }
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return { payload: payload as unknown as BasePayload, tables, updates }
}

const TENANT = 7
const stidsOnPages = new Set(NWAC_STATION_PAGES.flatMap((page) => page.stids))

describe('seedStationPages', () => {
  it('creates every page and only the stations a page lists', async () => {
    const { payload, tables } = fakePayload()
    const result = await seedStationPages(payload, TENANT)

    expect(result.pagesCreated).toBe(NWAC_STATION_PAGES.length)
    expect(result.stationsCreated).toBe(stidsOnPages.size)
    expect(result.stationsAssigned).toBe(stidsOnPages.size)
    expect(tables.stations.every((s) => s.page != null)).toBe(true)
    expect(NWAC_STATION_SNAPSHOT.length).toBeGreaterThan(stidsOnPages.size)
  })

  it('orders stations by their position in the page list', async () => {
    const { payload, tables } = fakePayload()
    await seedStationPages(payload, TENANT)

    const page = NWAC_STATION_PAGES.find((p) => p.stids.length > 1)
    const pageId = tables.stationPages.find((p) => p.slug === page?.slug)?.id
    const rows = tables.stations
      .filter((s) => s.page === pageId)
      .sort((a, b) => Number(a.pageOrder) - Number(b.pageOrder))
    expect(rows.map((s) => s.stid)).toEqual(page?.stids)
  })

  it('is idempotent and keeps an assignment an admin already made', async () => {
    const first = fakePayload()
    await seedStationPages(first.payload, TENANT)

    const [moved] = first.tables.stations
    const otherPage = first.tables.stationPages.find((p) => p.id !== moved.page)
    moved.page = otherPage?.id

    const second = fakePayload({
      stationPages: first.tables.stationPages,
      stations: first.tables.stations,
    })
    const result = await seedStationPages(second.payload, TENANT)

    expect(result).toEqual({ pagesCreated: 0, stationsCreated: 0, stationsAssigned: 0 })
    expect(second.updates).toHaveLength(0)
    expect(moved.page).toBe(otherPage?.id)
  })

  it('fills in a page for a synced station that has none', async () => {
    const stid = NWAC_STATION_PAGES[0].stids[0]
    const { payload, updates } = fakePayload({
      stations: [{ id: 1, tenant: TENANT, source: 'nwac', stid, page: null }],
    })
    const result = await seedStationPages(payload, TENANT)

    expect(result.stationsAssigned).toBe(stidsOnPages.size)
    expect(result.stationsCreated).toBe(stidsOnPages.size - 1)
    expect(updates).toEqual([
      { collection: 'stations', id: 1, data: { page: expect.any(Number), pageOrder: 0 } },
    ])
  })
})
