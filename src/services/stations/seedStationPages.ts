import type { StationPage } from '@/payload-types'
import type { PayloadRequest, Where } from 'payload'

// Every seeded station is one of NWAC's own loggers.
const SOURCE = 'nwac'

// NWAC's station pages and the Admin-role grant, run by the backfill migration
// in deployed environments and by `pnpm seed` locally (where the migration
// runs before any tenant exists). Kept out of the migration file so the
// migration stays disposable: branch migrations are deleted and recreated on
// a main merge (coding-guide.md), and this data must survive that.
//
// The 32 pages and their station assignments as they stood in the retired
// src/constants/weatherStations.ts registry. Names and elevations are never
// stored; the pages and the admin picker read them from SnowObs.

export type SeedStationPage = {
  slug: string
  displayName: string
  archived: boolean
  /** Old nwac.us /weatherdata/<slug>/now/ path, kept for a future redirect. */
  legacySlug: string
  /** SnowObs station ids in page order. */
  stids: string[]
}

export const NWAC_STATION_PAGES: SeedStationPage[] = [
  {
    slug: 'hurricane-ridge',
    displayName: 'Hurricane Ridge',
    archived: false,
    legacySlug: 'hurricaneridge',
    stids: ['4'],
  },
  {
    slug: 'mt-baker-ski-area',
    displayName: 'Mt. Baker Ski Area',
    archived: false,
    legacySlug: 'mtbakerskiarea',
    stids: ['6', '5'],
  },
  {
    slug: 'newhalem',
    displayName: 'Newhalem',
    archived: false,
    legacySlug: 'newhalem',
    stids: ['59'],
  },
  {
    slug: 'white-chuck',
    displayName: 'White Chuck',
    archived: false,
    legacySlug: 'whitechuck',
    stids: ['57'],
  },
  {
    slug: 'berne',
    displayName: 'Berne',
    archived: false,
    legacySlug: 'bernemaintenancestation',
    stids: ['12'],
  },
  {
    slug: 'stevens-pass-schmidt-haus',
    displayName: 'Stevens Pass - WSDOT Schmidt Haus',
    archived: false,
    legacySlug: 'stevenshwy2',
    stids: ['13'],
  },
  {
    slug: 'stevens-pass-brooks',
    displayName: 'Stevens Pass Ski Area - Brooks Chair',
    archived: false,
    legacySlug: 'brookssnow',
    stids: ['50'],
  },
  {
    slug: 'grace-lakes',
    displayName: 'Grace Lakes & Old Faithful',
    archived: false,
    legacySlug: 'gracelakes',
    stids: ['14', '51'],
  },
  {
    slug: 'stevens-ski-area',
    displayName: 'Stevens Pass Ski Area - Tye Mill Chair, Skyline Chair',
    archived: false,
    legacySlug: 'stevensskiarea',
    stids: ['18', '17'],
  },
  {
    slug: 'alpental',
    displayName: 'Alpental Ski Area',
    archived: false,
    legacySlug: 'alpental',
    stids: ['3', '2', '1'],
  },
  {
    slug: 'mt-washington',
    displayName: 'Mt. Washington',
    archived: false,
    legacySlug: 'mtwashington',
    stids: ['20'],
  },
  {
    slug: 'snoqualmie-pass',
    displayName: 'Snoqualmie Pass',
    archived: false,
    legacySlug: 'snoqualmiepass',
    stids: ['22', '23', '21'],
  },
  {
    slug: 'crystal-mt-ski-area',
    displayName: 'Crystal Mt. Ski Area',
    archived: false,
    legacySlug: 'crystalskiarea',
    stids: ['29', '28'],
  },
  {
    slug: 'crystal-mt-green-valley',
    displayName: 'Crystal Mt. - Green Valley & Campbell Basin',
    archived: false,
    legacySlug: 'crystalgrnvalley',
    stids: ['27', '54'],
  },
  {
    slug: 'camp-muir',
    displayName: 'Camp Muir',
    archived: false,
    legacySlug: 'campmuir',
    stids: ['34'],
  },
  {
    slug: 'paradise',
    displayName: 'Paradise',
    archived: false,
    legacySlug: 'paradise',
    stids: ['35', '36'],
  },
  {
    slug: 'sunrise',
    displayName: 'Sunrise',
    archived: false,
    legacySlug: 'sunrise',
    stids: ['30', '31'],
  },
  {
    slug: 'chinook-pass',
    displayName: 'Chinook Pass',
    archived: false,
    legacySlug: 'chinookpass',
    stids: ['32', '33'],
  },
  {
    slug: 'white-pass',
    displayName: 'White Pass Ski Area',
    archived: false,
    legacySlug: 'whitepass',
    stids: ['39', '37', '49'],
  },
  {
    slug: 'mt-st-helens',
    displayName: 'Mt. St. Helens',
    archived: true,
    legacySlug: 'mtsthelens',
    stids: ['40'],
  },
  {
    slug: 'mazama',
    displayName: 'Mazama',
    archived: false,
    legacySlug: 'mazama',
    stids: ['7'],
  },
  {
    slug: 'washington-pass',
    displayName: 'Washington Pass',
    archived: false,
    legacySlug: 'washingtonpass',
    stids: ['9', '8'],
  },
  {
    slug: 'blewett-pass',
    displayName: 'Blewett Pass',
    archived: false,
    legacySlug: 'blewettpass',
    stids: ['48'],
  },
  {
    slug: 'dirtyface-mtn',
    displayName: 'Dirtyface Mt',
    archived: false,
    legacySlug: 'dirtyfacemtn',
    stids: ['10'],
  },
  {
    slug: 'lake-wenatchee',
    displayName: 'Lake Wenatchee',
    archived: false,
    legacySlug: 'lakewenatchee',
    stids: ['11'],
  },
  {
    slug: 'mission-ridge',
    displayName: 'Mission Ridge Ski Area',
    archived: false,
    legacySlug: 'missionridge',
    stids: ['25', '26', '24'],
  },
  {
    slug: 'tumwater',
    displayName: 'Tumwater Mt. & Leavenworth',
    archived: false,
    legacySlug: 'tumwater',
    stids: ['19', '53'],
  },
  {
    slug: 'mt-hood-meadows',
    displayName: 'Mt. Hood Meadows Ski Area',
    archived: false,
    legacySlug: 'mthoodmeadows',
    stids: ['42', '43'],
  },
  {
    slug: 'cascade-express',
    displayName: 'Mt. Hood Meadows - Cascade Express',
    archived: false,
    legacySlug: 'cascade_express',
    stids: ['41'],
  },
  {
    slug: 'timberline-base',
    displayName: 'Timberline Lodge',
    archived: false,
    legacySlug: 'timberlinebase',
    stids: ['44', '56'],
  },
  {
    slug: 'timberline-upper',
    displayName: 'Timberline - Magic Mile Chair',
    archived: false,
    legacySlug: 'timberlineupper',
    stids: ['45'],
  },
  {
    slug: 'skibowl-ski-area',
    displayName: 'Skibowl Ski Area - Government Camp',
    archived: false,
    legacySlug: 'skibowlgovtcamp',
    stids: ['47', '46'],
  },
]

export type SeedResult = { pagesCreated: number }

type StationPageSeed = Pick<StationPage, 'slug' | 'displayName' | 'archived' | 'stations'> & {
  tenant: number
}

// The slice of the local API the seed uses. Payload's client satisfies it, and
// so does a plain object in a test, with no type assertion.
export type SeedPayload = {
  find(args: {
    collection: 'stationPages'
    where: Where
    limit: number
    depth: number
    select: { slug: true }
    req?: PayloadRequest
  }): Promise<{ docs: { slug: string }[] }>
  create(args: {
    collection: 'stationPages'
    data: StationPageSeed
    context: { disableRevalidate: boolean }
    req?: PayloadRequest
  }): Promise<unknown>
}

/**
 * Put NWAC's station pages in place for one tenant, once: a page that already
 * exists is left exactly as the admin has it.
 *
 * Runs inside migrations (deployed environments) and the local seed script,
 * which passes a short list, so it disables the cache hooks -- there is no
 * request to revalidate against.
 */
export async function seedStationPages(
  payload: SeedPayload,
  tenantId: number,
  pages: SeedStationPage[] = NWAC_STATION_PAGES,
  req?: PayloadRequest,
): Promise<SeedResult> {
  const context = { disableRevalidate: true }
  const { docs: existing } = await payload.find({
    collection: 'stationPages',
    where: { tenant: { equals: tenantId } },
    limit: 1000,
    depth: 0,
    select: { slug: true },
    req,
  })
  const present = new Set(existing.map((page) => page.slug))

  const result: SeedResult = { pagesCreated: 0 }
  for (const page of pages) {
    if (present.has(page.slug)) continue
    await payload.create({
      collection: 'stationPages',
      data: {
        tenant: tenantId,
        slug: page.slug,
        displayName: page.displayName,
        archived: page.archived,
        stations: page.stids.map((stid) => ({ stid, source: SOURCE })),
      },
      context,
      req,
    })
    result.pagesCreated++
  }

  return result
}

const STATION_COLLECTIONS = ['stationPages']

// The slice of the local API the grant uses, so a test can hand in a plain object.
export type GrantPayload = {
  find(args: {
    collection: 'roles'
    where: Where
    limit: number
    pagination: boolean
    depth: number
    req?: PayloadRequest
  }): Promise<{ docs: RoleRow[] }>
  update(args: {
    collection: 'roles'
    id: number
    data: { rules: RoleRule[] }
    req?: PayloadRequest
  }): Promise<unknown>
}

export type RoleRule = { collections?: string[] | null; actions?: string[] | null }
export type RoleRow = { id: number; rules?: RoleRule[] | null }

/**
 * Let each center's Admin role manage the station pages.
 *
 * Tenant roles list their collections explicitly, so a new collection is
 * invisible to every existing Admin until someone edits the role. Finds the
 * rule that already grants full access to `settings` (the marker of an admin
 * rule) and appends the station collections to it, once. A center that
 * renamed its Admin role is left alone and gets nothing. Super admins are
 * unaffected: their `*` already covers everything.
 */
export async function grantStationAccess(
  payload: GrantPayload,
  req?: PayloadRequest,
): Promise<number> {
  const { docs: roles } = await payload.find({
    collection: 'roles',
    where: { name: { equals: 'Admin' } },
    limit: 0,
    pagination: false,
    depth: 0,
    req,
  })

  let updated = 0
  for (const role of roles) {
    let changed = false
    const rules = (role.rules ?? []).map((rule) => {
      const collections = rule.collections ?? []
      const isAdminRule = collections.includes('settings') && (rule.actions ?? []).includes('*')
      const missing = STATION_COLLECTIONS.filter((slug) => !collections.includes(slug))
      if (!isAdminRule || missing.length === 0) return rule
      changed = true
      return { ...rule, collections: [...collections, ...missing] }
    })
    if (!changed) continue
    await payload.update({ collection: 'roles', id: role.id, data: { rules }, req })
    updated++
  }
  return updated
}
