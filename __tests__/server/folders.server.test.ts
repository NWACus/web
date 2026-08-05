import { filterByTenant } from '@/access/filterByTenant'
import { TENANT_SCOPED_COLLECTIONS } from '@/collections/Tenants/hooks/deprovisionBeforeDelete'
import { FOLDERS_SLUG, folders } from '@/folders'
import type { CollectionConfig } from 'payload'

// Minimal stand-in mirroring the shape Payload's createFolderCollection produces
// before our override runs.
const buildBaseFolderCollection = (): Omit<CollectionConfig, 'trash'> => ({
  slug: FOLDERS_SLUG,
  access: {
    create: () => true,
    read: () => true,
    update: () => true,
    delete: () => true,
  },
  admin: {
    hidden: true,
    useAsTitle: 'name',
  },
  fields: [{ name: 'name', type: 'text', required: true }],
})

describe('folders config', () => {
  it('is enabled under the payload-folders slug', () => {
    expect(folders.slug).toBe('payload-folders')
    expect(FOLDERS_SLUG).toBe('payload-folders')
  })

  it('registers the folder collection for tenant deprovisioning', () => {
    // Without this, folders would orphan (or FK-error) when a tenant is deleted.
    expect(TENANT_SCOPED_COLLECTIONS).toContain(FOLDERS_SLUG)
  })

  it('injects tenant scoping into the generated folder collection', () => {
    const result = folders.collectionOverrides[0]({ collection: buildBaseFolderCollection() })

    // A required tenant relationship is appended.
    const tenant = result.fields.find((f) => 'name' in f && f.name === 'tenant')
    expect(tenant).toBeDefined()
    if (!tenant || !('relationTo' in tenant)) throw new Error('tenant field missing')
    expect(tenant.type).toBe('relationship')
    expect(tenant.relationTo).toBe('tenants')
    expect(tenant.required).toBe(true)

    // The base list filter enforces the selected-tenant scope in the admin.
    expect(result.admin?.baseListFilter).toBe(filterByTenant)
    // Existing admin options are preserved.
    expect(result.admin?.useAsTitle).toBe('name')

    // Tenant-aware RBAC replaces the permissive default access.
    expect(typeof result.access?.create).toBe('function')
    expect(typeof result.access?.read).toBe('function')
    expect(typeof result.access?.update).toBe('function')
    expect(typeof result.access?.delete).toBe('function')

    // The original `name` field is preserved.
    expect(result.fields.some((f) => 'name' in f && f.name === 'name')).toBe(true)
  })
})
