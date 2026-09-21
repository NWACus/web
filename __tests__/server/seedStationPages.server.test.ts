import type { GrantPayload, RoleRow, SeedPayload } from '@/services/stations/seedStationPages'
import {
  grantStationAccess,
  NWAC_STATION_PAGES,
  seedStationPages,
} from '@/services/stations/seedStationPages'

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

describe('grantStationAccess', () => {
  const adminRule = { collections: ['pages', 'settings'], actions: ['*'] }
  const readRule = { collections: ['navigations', 'tenants'], actions: ['read'] }

  function fakeRoles(roles: RoleRow[]) {
    const updates: { id: number; rules: unknown }[] = []
    const payload: GrantPayload = {
      find: async () => ({ docs: roles }),
      update: async ({ id, data }) => {
        updates.push({ id, rules: data.rules })
        return {}
      },
    }
    return { payload, updates }
  }

  it('appends the collection to the full-access rule of every Admin role, once', async () => {
    const { payload, updates } = fakeRoles([
      { id: 1, rules: [adminRule, readRule] },
      { id: 2, rules: [{ ...adminRule, collections: ['settings', 'stationPages'] }] },
    ])
    expect(await grantStationAccess(payload)).toBe(1)
    expect(updates).toEqual([
      {
        id: 1,
        rules: [{ ...adminRule, collections: ['pages', 'settings', 'stationPages'] }, readRule],
      },
    ])
  })

  it('leaves a role without a full-access settings rule alone', async () => {
    const { payload, updates } = fakeRoles([
      { id: 3, rules: [{ collections: ['settings'], actions: ['read'] }, readRule] },
      { id: 4, rules: null },
    ])
    expect(await grantStationAccess(payload)).toBe(0)
    expect(updates).toEqual([])
  })
})
