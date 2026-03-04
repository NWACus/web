import { openNav } from '../../fixtures/nav.fixture'
import {
  expect,
  TenantNames,
  tenantSelectorTest as test,
} from '../../fixtures/tenant-selector.fixture'
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

test.describe.configure({ timeout: 90000 })

test.describe('Tenant selector syncs on save', () => {
  test('should update tenant name in selector after save without hard refresh', async ({
    loginAs,
    getTenantOptions,
  }) => {
    const page = await loginAs('superAdmin')
    const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.tenants)

    // Go to tenant list and find DVAC
    await page.goto(url.list)
    await page.waitForLoadState('networkidle')

    // Click on DVAC to edit it
    await page.locator(`text=${TenantNames.dvac}`).click()
    await page.waitForLoadState('networkidle')
    await waitForFormReady(page)

    // Store the original name
    const nameField = page.locator('#field-name')
    const originalName = await nameField.inputValue()

    // Change the name and save
    const tempName = 'DVAC Renamed Test'
    await nameField.fill(tempName)
    await saveDocAndAssert(page)

    // Wait for syncTenants to complete its fetch
    await page.waitForTimeout(1000)

    // Open nav and click through to a tenant-scoped collection via client-side navigation
    // The selector should already have the updated name from syncTenants()
    await openNav(page)
    const pagesUrl = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.pages)
    await page.locator(`nav a[href="${pagesUrl.list}"]`).click()
    await page.waitForLoadState('networkidle')

    // The tenant selector should show the updated name without a page reload
    const options = await getTenantOptions(page)
    expect(options).toContain(tempName)
    expect(options).not.toContain(originalName)

    // Restore the original name
    await page.goto(url.list)
    await page.waitForLoadState('networkidle')
    await page.locator(`text=${tempName}`).click()
    await page.waitForLoadState('networkidle')
    await waitForFormReady(page)

    await page.locator('#field-name').fill(originalName)
    await saveDocAndAssert(page)

    await page.context().close()
  })
})
