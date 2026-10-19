import type { Where } from 'payload'

let mockTenantRoleResult: boolean | Where = true
jest.mock('../../src/access/byTenantRole', () => ({
  ...jest.requireActual('../../src/access/byTenantRole'),
  byTenantRole: () => async () => mockTenantRoleResult,
}))

import { filterByTenantID } from '@/access/filterByTenant'
import { folderAccess } from '@/collections/Folders/access'
import { filterFoldersByTenant } from '@/collections/Folders/filter'

const tenantIDs: Record<string, number> = { nwac: 2, sac: 3 }

function buildReq(cookieTenant?: string) {
  const find = jest.fn(async ({ where }: { where: { slug: { equals: string } } }) => {
    const id = tenantIDs[where.slug.equals]
    return { docs: id ? [{ id }] : [] }
  })
  return {
    payload: { find },
    headers: new Headers(cookieTenant ? { cookie: `payload-tenant=${cookieTenant}` } : {}),
  }
}

async function read(cookieTenant?: string) {
  const req = buildReq(cookieTenant)
  // @ts-expect-error -- a partial request: access only reads payload.find and headers
  const result = await folderAccess?.read?.({ req })
  return { result, find: req.payload.find }
}

describe('folderAccess', () => {
  beforeEach(() => {
    mockTenantRoleResult = true
  })

  it('narrows a tenant role grant to the selected tenant, by ID', async () => {
    const { result } = await read('sac')
    expect(result).toEqual({ tenant: { equals: 3 } })
  })

  it('keeps the grant when no tenant is selected', async () => {
    const { result } = await read()
    expect(result).toBe(true)
  })

  it('passes a denial or an existing constraint through untouched', async () => {
    mockTenantRoleResult = false
    const denied = await read('sac')
    expect(denied.result).toBe(false)
    expect(denied.find).not.toHaveBeenCalled()

    mockTenantRoleResult = { tenant: { in: [2, 3] } }
    expect((await read('sac')).result).toEqual({ tenant: { in: [2, 3] } })
  })

  it('narrows update and delete the same way', async () => {
    for (const operation of [folderAccess?.update, folderAccess?.delete]) {
      const req = buildReq('nwac')
      // @ts-expect-error -- a partial request: access only reads payload.find and headers
      expect(await operation?.({ req })).toEqual({ tenant: { equals: 2 } })
    }
  })
})

describe('filterByTenantID', () => {
  async function filter(cookieTenant?: string) {
    // @ts-expect-error -- a partial request: the filter only reads payload.find and headers
    return filterByTenantID({ req: buildReq(cookieTenant), limit: 0, page: 1, sort: 'id' })
  }

  it('filters on the selected tenant ID, which folder joins can query', async () => {
    expect(await filter('sac')).toEqual({ tenant: { equals: 3 } })
  })

  it('falls back to the slug when the tenant has no document', async () => {
    expect(await filter('dvac')).toEqual({ 'tenant.slug': { equals: 'dvac' } })
  })

  it('does not filter without a selected tenant', async () => {
    expect(await filter()).toBeNull()
  })
})

describe('filterFoldersByTenant', () => {
  async function filter(cookieTenant?: string) {
    // @ts-expect-error -- a partial request: the filter only reads payload.find and headers
    return filterFoldersByTenant({ req: buildReq(cookieTenant), limit: 0, page: 1, sort: 'id' })
  }

  it('filters on the selected tenant ID', async () => {
    expect(await filter('sac')).toEqual({ tenant: { equals: 3 } })
  })

  it('matches no folders without a selected tenant', async () => {
    expect(await filter()).toEqual({ id: { exists: false } })
  })
})
