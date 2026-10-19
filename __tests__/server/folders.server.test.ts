// Media's hooks import the Payload config, which jest cannot load
jest.mock('../../src/payload.config', () => ({}))

import { folders } from '@/collections/Folders'
import { FOLDERS_SLUG } from '@/collections/Folders/constants'
import { filterFoldersByTenant } from '@/collections/Folders/filter'
import { keepFolderTenant } from '@/collections/Folders/hooks/keepFolderTenant'
import { validateFolderTenant } from '@/collections/Folders/hooks/validateFolderTenant'
import { Media } from '@/collections/Media'
import { TENANT_SCOPED_COLLECTIONS } from '@/collections/Tenants/hooks/deprovisionBeforeDelete'
import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'

type HookArgs = Parameters<CollectionBeforeValidateHook>[0]

const SAC = { id: 3, slug: 'sac' }
const NWAC = { id: 2, slug: 'nwac' }

// Folder 10 belongs to SAC, folder 20 to NWAC
const folderTenants: Record<number, typeof SAC> = { 10: SAC, 20: NWAC }

function runValidate(
  args: Pick<HookArgs, 'data' | 'originalDoc'>,
  { cookieTenant }: { cookieTenant?: string } = {},
) {
  const findByID = jest.fn(async ({ id }: { id: number }) =>
    id in folderTenants ? { id, tenant: folderTenants[id] } : null,
  )
  const req = {
    payload: { findByID },
    headers: new Headers(cookieTenant ? { cookie: `payload-tenant=${cookieTenant}` } : {}),
    t: (key: string) => key,
  }
  const result = validateFolderTenant({
    ...args,
    // @ts-expect-error -- a partial request: the hook only reads payload.findByID, headers and t
    req,
    // @ts-expect-error -- a partial collection config: the hook never reads it
    collection: { slug: 'media' },
    context: {},
    operation: args.originalDoc ? 'update' : 'create',
  })
  return { result, findByID }
}

describe('validateFolderTenant', () => {
  it('accepts a folder from the same tenant', async () => {
    const { result } = runValidate({ data: { tenant: SAC.id, folder: 10 } })
    await expect(result).resolves.toEqual({ tenant: SAC.id, folder: 10 })
  })

  it('refuses a folder from another tenant, flagging the folder field', async () => {
    const { result } = runValidate({ data: { tenant: SAC.id, folder: 20 } })
    await expect(result).rejects.toMatchObject({
      name: 'ValidationError',
      data: { errors: [{ path: 'folder' }] },
    })
  })

  it('refuses moving a filed document to another tenant', async () => {
    const { result } = runValidate({
      data: { tenant: NWAC.id },
      originalDoc: { id: 1, tenant: SAC.id, folder: 10 },
    })
    await expect(result).rejects.toMatchObject({ name: 'ValidationError' })
  })

  it('checks against the selected tenant on create, before tenantField fills it in', async () => {
    await expect(
      runValidate({ data: { folder: 10 } }, { cookieTenant: 'sac' }).result,
    ).resolves.toEqual({ folder: 10 })
    await expect(
      runValidate({ data: { folder: 10 } }, { cookieTenant: 'nwac' }).result,
    ).rejects.toMatchObject({ name: 'ValidationError' })
  })

  it('skips the lookup when the document is not in a folder', async () => {
    const { result, findByID } = runValidate({
      data: { folder: null },
      originalDoc: { id: 1, tenant: SAC.id, folder: 20 },
    })
    await expect(result).resolves.toEqual({ folder: null })
    expect(findByID).not.toHaveBeenCalled()
  })

  it('leaves a missing folder to the relationship validation', async () => {
    const { result } = runValidate({ data: { tenant: SAC.id, folder: 999 } })
    await expect(result).resolves.toEqual({ tenant: SAC.id, folder: 999 })
  })
})

describe('keepFolderTenant', () => {
  function runKeep(args: Pick<HookArgs, 'data' | 'originalDoc' | 'operation'>) {
    return keepFolderTenant({
      ...args,
      // @ts-expect-error -- a partial request: the hook never reads it
      req: {},
      // @ts-expect-error -- a partial collection config: the hook never reads it
      collection: { slug: FOLDERS_SLUG },
      context: {},
    })
  }

  it('reverts a changed tenant on update', () => {
    expect(
      runKeep({
        data: { name: 'Bios', tenant: NWAC.id },
        originalDoc: { id: 10, name: 'Bios', tenant: SAC },
        operation: 'update',
      }),
    ).toEqual({ name: 'Bios', tenant: SAC.id })
  })

  it('leaves the tenant alone on create', () => {
    expect(runKeep({ data: { name: 'Bios', tenant: NWAC.id }, operation: 'create' })).toEqual({
      name: 'Bios',
      tenant: NWAC.id,
    })
  })
})

describe('folders config', () => {
  // A stand-in for the collection Payload's createFolderCollection generates
  const reparentChildFolder = jest.fn()
  const generated: Omit<CollectionConfig, 'trash'> = {
    slug: FOLDERS_SLUG,
    access: { read: () => true },
    admin: { hidden: true, useAsTitle: 'name' },
    fields: [{ name: 'name', type: 'text', required: true }],
    hooks: { afterChange: [reparentChildFolder] },
  }

  async function overridden() {
    const [override] = folders.collectionOverrides ?? []
    return override({ collection: generated })
  }

  it('adds a required tenant field and keeps the generated fields', async () => {
    const { fields } = await overridden()
    const names = fields.map((field) => ('name' in field ? field.name : undefined))
    expect(names).toEqual(expect.arrayContaining(['tenant', 'name', 'contentHash']))
    expect(fields.find((field) => 'name' in field && field.name === 'tenant')).toMatchObject({
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
    })
  })

  it('filters folder views by the selected tenant, keeping the generated admin options', async () => {
    const { admin } = await overridden()
    expect(admin?.baseListFilter).toBe(filterFoldersByTenant)
    expect(admin?.useAsTitle).toBe('name')
    expect(admin?.hidden).toBe(true)
  })

  it('replaces the open default access with tenant-aware access', async () => {
    const { access } = await overridden()
    expect(access?.read).not.toBe(generated.access?.read)
    const operations: ('create' | 'read' | 'update' | 'delete')[] = [
      'create',
      'read',
      'update',
      'delete',
    ]
    for (const operation of operations) {
      expect(typeof access?.[operation]).toBe('function')
    }
  })

  it("keeps Payload's folder hooks and adds the tenant guards", async () => {
    const { hooks } = await overridden()
    expect(hooks?.afterChange).toEqual([reparentChildFolder])
    expect(hooks?.beforeValidate).toEqual([keepFolderTenant, validateFolderTenant])
  })
})

describe('folder-enabled collections', () => {
  it('Media has folders and guards their tenant', () => {
    expect(Media.folders).toBe(true)
    expect(Media.hooks?.beforeValidate).toContain(validateFolderTenant)
  })

  it("deletes a tenant's folders when the tenant is deleted", () => {
    expect(TENANT_SCOPED_COLLECTIONS).toContain(FOLDERS_SLUG)
  })
})
