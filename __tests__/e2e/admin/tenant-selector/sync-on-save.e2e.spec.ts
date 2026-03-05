import { openNav } from '../../fixtures/nav.fixture'
import { expect, tenantSelectorTest as test } from '../../fixtures/tenant-selector.fixture'
import {
  AdminUrlUtil,
  CollectionSlugs,
  saveDocAndAssert,
  TenantNames,
  waitForFormReady,
} from '../../helpers'

/**
 * Sync on Save Tests
 *
 * Tests that the tenant selector dropdown refreshes automatically when a
 * tenant is saved (created or updated), without requiring a page reload.
 *
 * The SyncTenantsOnSave component watches useDocumentInfo().lastUpdateTime
 * and calls syncTenants() when it changes.
 */

const DVAC_ORIGINAL_NAME = TenantNames.dvac

test.describe.configure({ timeout: 90000 })

test.describe('Tenant selector syncs on save', () => {
  test('should update tenant name in selector after renaming a tenant', async ({
    loginAs,
    getTenantOptions,
  }) => {
    const page = await loginAs('superAdmin')
    const tenantsUrl = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.tenants)

    // Find the DVAC tenant by slug (resilient to name changes from prior failed runs)
    const response = await page.request.get(
      'http://localhost:3000/api/tenants?where[slug][equals]=dvac&limit=1',
    )
    const data = await response.json()
    const tenantId = data.docs[0].id

    // Ensure DVAC has its canonical name before starting (cleanup from prior failed runs)
    if (data.docs[0].name !== DVAC_ORIGINAL_NAME) {
      await page.request.patch(`http://localhost:3000/api/tenants/${tenantId}`, {
        data: { name: DVAC_ORIGINAL_NAME },
      })
    }

    // Navigate to the tenant edit page
    await page.goto(tenantsUrl.edit(tenantId))
    await page.waitForLoadState('networkidle')
    await waitForFormReady(page)

    // Change the name
    const tempName = 'DVAC Renamed Test'
    const nameField = page.locator('#field-name')
    await nameField.fill(tempName)

    // Save - SyncTenantsOnSave should refresh the selector without a page reload
    await saveDocAndAssert(page)

    // Navigate to a tenant-scoped collection via client-side nav link (NOT page.goto)
    // so we stay in the same SPA session and verify the synced React state
    await openNav(page)
    await Promise.all([
      page.waitForURL('**/admin/collections/pages'),
      page.locator('nav a[href="/admin/collections/pages"]').click(),
    ])
    await page.waitForLoadState('networkidle')

    // The tenant selector should show the updated name without a full page reload
    const options = await getTenantOptions(page)
    expect(options).toContain(tempName)
    expect(options).not.toContain(DVAC_ORIGINAL_NAME)

    // Restore the original name via API (reliable cleanup)
    await page.request.patch(`http://localhost:3000/api/tenants/${tenantId}`, {
      data: { name: DVAC_ORIGINAL_NAME },
    })

    await page.context().close()
  })
})
