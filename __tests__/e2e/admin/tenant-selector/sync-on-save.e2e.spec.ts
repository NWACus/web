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

const TEMP_TENANT_SLUG = 'e2e-sync-test'
const TEMP_TENANT_NAME = 'E2E Sync Test Center'
const UPDATED_TENANT_NAME = 'E2E Sync Test Renamed'

test.describe.configure({ timeout: 90000 })

/** Delete a tenant by slug if it exists (cleanup from previous runs) */
async function deleteTenantBySlug(page: import('@playwright/test').Page, slug: string) {
  const response = await page.request.get(
    `http://localhost:3000/api/tenants?where[slug][equals]=${slug}&limit=1`,
  )
  const data = await response.json()
  if (data.docs?.[0]) {
    await page.request.delete(`http://localhost:3000/api/tenants/${data.docs[0].id}`)
  }
}

/** Find a tenant by slug, returning its ID */
async function findTenantBySlug(
  page: import('@playwright/test').Page,
  slug: string,
): Promise<number | undefined> {
  const response = await page.request.get(
    `http://localhost:3000/api/tenants?where[slug][equals]=${slug}&limit=1`,
  )
  const data = await response.json()
  return data.docs?.[0]?.id
}

test.describe('Tenant selector syncs on save', () => {
  test('should show new tenant in selector after creation', async ({
    loginAs,
    getTenantOptions,
  }) => {
    const page = await loginAs('superAdmin')
    const tenantsUrl = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.tenants)

    // Clean up leftover tenants from previous failed runs
    await deleteTenantBySlug(page, TEMP_TENANT_SLUG)

    try {
      // Navigate to create a new tenant
      await page.goto(tenantsUrl.create)
      await page.waitForLoadState('networkidle')
      await waitForFormReady(page)

      await page.locator('#field-name').fill(TEMP_TENANT_NAME)
      await page.locator('#field-slug').fill(TEMP_TENANT_SLUG)
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
      expect(options).toContain(TEMP_TENANT_NAME)
    } finally {
      // Don't delete — test 2 reuses this tenant
      await page.context().close()
    }
  })

  test('should update tenant name in selector after editing', async ({
    loginAs,
    getTenantOptions,
  }) => {
    const page = await loginAs('superAdmin')
    const tenantsUrl = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.tenants)

    try {
      // Find the tenant created by the previous test
      const tenantId = await findTenantBySlug(page, TEMP_TENANT_SLUG)
      if (!tenantId) {
        throw new Error(`Tenant with slug "${TEMP_TENANT_SLUG}" not found — test 1 may have failed`)
      }

      // Navigate to the tenant edit page
      await page.goto(tenantsUrl.edit(tenantId))
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
      expect(options).not.toContain(TEMP_TENANT_NAME)
    } finally {
      await deleteTenantBySlug(page, TEMP_TENANT_SLUG)
      await page.context().close()
    }
  })
})
