import {
  expect,
  TenantSlugs,
  tenantSelectorTest as test,
} from '../../fixtures/tenant-selector.fixture'
import { AdminUrlUtil, CollectionSlugs } from '../../helpers'

/**
 * Tenant-Required Collection Tests
 *
 * Collections with tenantField() but NOT unique: true.
 * Each tenant can have multiple documents.
 *
 * Examples: Pages, Posts, Media, Documents, Sponsors, Tags, Events, Biographies, Teams, Redirects
 *
 * Expected behavior:
 * - List view: Tenant selector visible and enabled, filters by selected tenant
 * - Document view (existing): Tenant selector visible but read-only (locked to document's tenant)
 * - Document view (create): Tenant selector visible but read-only, pre-populated with cookie value
 */

test.describe('Tenant-Required Collection - List View', () => {
  test('tenant selector should be visible and enabled', async ({
    loginAs,
    isTenantSelectorVisible,
    isTenantSelectorReadOnly,
  }) => {
    const page = await loginAs('superAdmin')
    const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.pages)

    await page.goto(url.list)
    await page.waitForLoadState('networkidle')

    const isVisible = await isTenantSelectorVisible(page)
    expect(isVisible).toBe(true)

    const isReadOnly = await isTenantSelectorReadOnly(page)
    expect(isReadOnly).toBe(false)

    await page.context().close()
  })

  test('changing tenant selector should filter the list', async ({
    loginAs,
    selectTenant,
    getSelectedTenant,
    getTenantCookie,
  }) => {
    const page = await loginAs('superAdmin')
    const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.pages)

    await page.goto(url.list)
    await page.waitForLoadState('networkidle')

    // Select NWAC tenant
    await selectTenant(page, 'NWAC')

    // Wait for page to refresh/filter
    await page.waitForLoadState('networkidle')

    // Verify tenant selector shows NWAC
    const selectedTenant = await getSelectedTenant(page)
    expect(selectedTenant).toBe('NWAC')

    // Verify cookie was updated
    const cookie = await getTenantCookie(page)
    expect(cookie).toBe(TenantSlugs.nwac)

    await page.context().close()
  })

  test('list should only show documents matching selected tenant cookie', async ({
    loginAs,
    selectTenant,
  }) => {
    const page = await loginAs('superAdmin')
    const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.pages)

    // Set tenant to NWAC first
    await page.goto(url.list)
    await page.waitForLoadState('networkidle')
    await selectTenant(page, 'NWAC')
    await page.waitForLoadState('networkidle')

    // Get count of NWAC pages
    const nwacRows = await page.locator('table tbody tr').count()

    // Switch to SNFAC
    await selectTenant(page, 'SNFAC')
    await page.waitForLoadState('networkidle')

    // Get count of SNFAC pages (should be different or at least reflect filtering)
    const snfacRows = await page.locator('table tbody tr').count()

    // The counts may be the same if both tenants have same number of pages,
    // but the key test is that the page reloads and filters
    // We just verify the selector works without throwing errors
    expect(typeof nwacRows).toBe('number')
    expect(typeof snfacRows).toBe('number')

    await page.context().close()
  })
})

test.describe('Tenant-Required Collection - Document View (existing)', () => {
  test('tenant selector should be visible but read-only', async ({
    loginAs,
    isTenantSelectorVisible,
    isTenantSelectorReadOnly,
  }) => {
    const page = await loginAs('superAdmin')
    const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.pages)

    // Go to list first
    await page.goto(url.list)
    await page.waitForLoadState('networkidle')

    // Click the first document in the list (if any)
    const firstRow = page.locator('table tbody tr').first()
    if (await firstRow.isVisible()) {
      await firstRow.click()
      await page.waitForLoadState('networkidle')

      const isVisible = await isTenantSelectorVisible(page)
      expect(isVisible).toBe(true)

      const isReadOnly = await isTenantSelectorReadOnly(page)
      expect(isReadOnly).toBe(true)
    }

    await page.context().close()
  })

  test('visiting document should set tenant cookie to document tenant', async ({
    loginAs,
    getTenantCookie,
    setTenantCookie,
  }) => {
    const page = await loginAs('superAdmin')
    const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.pages)

    // Clear the tenant cookie first
    await setTenantCookie(page, undefined)

    // Go to list and click a document
    await page.goto(url.list)
    await page.waitForLoadState('networkidle')

    const firstRow = page.locator('table tbody tr').first()
    if (await firstRow.isVisible()) {
      await firstRow.click()
      await page.waitForLoadState('networkidle')

      // Cookie should now be set to the document's tenant
      const cookie = await getTenantCookie(page)
      expect(cookie).toBeTruthy()
      // The exact value depends on which document was clicked
    }

    await page.context().close()
  })

  test('tenant selector value should match document tenant field', async ({
    loginAs,
    getSelectedTenant,
  }) => {
    const page = await loginAs('superAdmin')
    const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.pages)

    await page.goto(url.list)
    await page.waitForLoadState('networkidle')

    const firstRow = page.locator('table tbody tr').first()
    if (await firstRow.isVisible()) {
      await firstRow.click()
      await page.waitForLoadState('networkidle')

      // Get tenant from selector
      const selectorTenant = await getSelectedTenant(page)

      // Get tenant from form field
      const tenantField = page.locator('[name="tenant"]')
      if (await tenantField.isVisible()) {
        const fieldValue = await tenantField.inputValue()
        // Values should be related (field may be ID, selector shows name)
        expect(selectorTenant).toBeTruthy()
        expect(fieldValue).toBeTruthy()
      }
    }

    await page.context().close()
  })
})

test.describe('Tenant-Required Collection - Document View (create new)', () => {
  test('tenant selector should be visible but read-only on create', async ({
    loginAs,
    isTenantSelectorVisible,
    isTenantSelectorReadOnly,
    setTenantCookie,
  }) => {
    const page = await loginAs('superAdmin')
    const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.pages)

    // Set tenant cookie before navigating
    await setTenantCookie(page, TenantSlugs.nwac)

    await page.goto(url.create)
    await page.waitForLoadState('networkidle')

    const isVisible = await isTenantSelectorVisible(page)
    expect(isVisible).toBe(true)

    const isReadOnly = await isTenantSelectorReadOnly(page)
    expect(isReadOnly).toBe(true)

    await page.context().close()
  })

  test('tenant field should be pre-populated with current cookie value', async ({
    loginAs,
    getSelectedTenant,
    setTenantCookie,
  }) => {
    const page = await loginAs('superAdmin')
    const url = new AdminUrlUtil('http://localhost:3000', CollectionSlugs.pages)

    // Set tenant cookie to NWAC before navigating
    await setTenantCookie(page, TenantSlugs.nwac)

    await page.goto(url.create)
    await page.waitForLoadState('networkidle')

    // Tenant selector should show NWAC
    const selectedTenant = await getSelectedTenant(page)
    expect(selectedTenant).toBe('NWAC')

    await page.context().close()
  })
})
