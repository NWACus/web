import { openNav } from '../../fixtures/nav.fixture'
import { expect, tenantSelectorTest as test } from '../../fixtures/tenant-selector.fixture'
import { AdminUrlUtil, CollectionSlugs, saveDocAndAssert, waitForFormReady } from '../../helpers'

/**
 * Sync on Save Tests
 *
 * Tests that the tenant selector dropdown refreshes automatically when a
 * tenant is saved (created or updated), without requiring a page reload.
 *
 * The SyncTenantsOnSave component watches useDocumentInfo().lastUpdateTime
 * and calls syncTenants() when it changes.
 */

const TEMP_TENANT_SLUG_CREATE = 'e2e-sync-create'
const TEMP_TENANT_NAME_CREATE = 'E2E Sync Create Center'

const TEMP_TENANT_SLUG_EDIT = 'e2e-sync-edit'
const TEMP_TENANT_NAME_EDIT = 'E2E Sync Edit Center'
const UPDATED_TENANT_NAME = 'E2E Sync Edit Renamed'

test.describe.configure({ timeout: 90000 })

test.describe('Tenant selector syncs on save', () => {
  test('should show new tenant in selector after creation', async ({
    loginAs,
    getTenantOptions,
  }) => {
    const page = await loginAs('superAdmin')
    const tenantsUrl = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.tenants)

    try {
      // Navigate to create a new tenant
      await page.goto(tenantsUrl.create)
      await page.waitForLoadState('networkidle')
      await waitForFormReady(page)

      await page.locator('#field-name').fill(TEMP_TENANT_NAME_CREATE)
      await page.locator('#field-slug').fill(TEMP_TENANT_SLUG_CREATE)
      await saveDocAndAssert(page)

      // Navigate to a tenant-scoped collection via client-side nav link (NOT page.goto)
      await openNav(page)
      await Promise.all([
        page.waitForURL('**/admin/collections/pages'),
        page.locator('nav a[href="/admin/collections/pages"]').click(),
      ])
      await page.waitForLoadState('networkidle')

      // The tenant selector should show the new tenant without a full page reload
      const options = await getTenantOptions(page)
      expect(options).toContain(TEMP_TENANT_NAME_CREATE)
    } finally {
      // Clean up: delete the temporary tenant
      const response = await page.request.get(
        `http://localhost:3000/api/tenants?where[slug][equals]=${TEMP_TENANT_SLUG_CREATE}&limit=1`,
      )
      const data = await response.json()
      if (data.docs?.[0]) {
        await page.request.delete(`http://localhost:3000/api/tenants/${data.docs[0].id}`)
      }
      await page.context().close()
    }
  })

  test('should update tenant name in selector after editing', async ({
    loginAs,
    getTenantOptions,
  }) => {
    const page = await loginAs('superAdmin')
    const tenantsUrl = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.tenants)

    // Create a temporary tenant via API
    const createResponse = await page.request.post('http://localhost:3000/api/tenants', {
      data: { name: TEMP_TENANT_NAME_EDIT, slug: TEMP_TENANT_SLUG_EDIT },
    })
    const { doc: tenant } = await createResponse.json()

    try {
      // Navigate to the tenant edit page
      await page.goto(tenantsUrl.edit(tenant.id))
      await page.waitForLoadState('networkidle')
      await waitForFormReady(page)

      // Rename the tenant
      await page.locator('#field-name').fill(UPDATED_TENANT_NAME)
      await saveDocAndAssert(page)

      // Navigate to a tenant-scoped collection via client-side nav link (NOT page.goto)
      await openNav(page)
      await Promise.all([
        page.waitForURL('**/admin/collections/pages'),
        page.locator('nav a[href="/admin/collections/pages"]').click(),
      ])
      await page.waitForLoadState('networkidle')

      const options = await getTenantOptions(page)
      expect(options).toContain(UPDATED_TENANT_NAME)
      expect(options).not.toContain(TEMP_TENANT_NAME_EDIT)
    } finally {
      // Clean up: delete the temporary tenant
      await page.request.delete(`http://localhost:3000/api/tenants/${tenant.id}`)
      await page.context().close()
    }
  })
})
